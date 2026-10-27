import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function createRuntime() {
    const context = vm.createContext({
        console,
        Date,
        JSON,
        Number,
        String,
        Object,
        Array,
        RegExp,
        Math
    });
    context.window = context;
    context.globalThis = context;

    vm.runInContext(
        fs.readFileSync(new URL('../nosql-datasets.js', import.meta.url), 'utf8'),
        context
    );
    vm.runInContext(
        fs.readFileSync(new URL('../nosql-engine.js', import.meta.url), 'utf8'),
        context
    );

    return context;
}

const runtime = createRuntime();
const NoSQL = runtime.NoSQL;
const datasets = runtime.NOSQL_DATASETS;

function createSchoolDatabase() {
    return NoSQL.createDatabase(datasets.escuela);
}

test('parseCommand acepta claves sin comillas y valores anidados', () => {
    const command = NoSQL.parseCommand(
        "db.estudiantes.find({ edad: { $gte: 18 }, ciudad: 'Lima' }).sort({ promedio: -1 }).limit(3)"
    );

    assert.equal(command.collection, 'estudiantes');
    assert.equal(command.methods.length, 3);
    assert.equal(command.methods[0].name, 'find');
    assert.equal(
        JSON.stringify(command.methods[0].args[0]),
        JSON.stringify({ edad: { $gte: 18 }, ciudad: 'Lima' })
    );
    assert.equal(command.methods[1].args[0].promedio, -1);
    assert.equal(command.methods[2].args[0], 3);
});

test('find aplica filtros, proyección, orden y límite', () => {
    const db = createSchoolDatabase();
    const result = NoSQL.executeCommand(
        db,
        "db.estudiantes.find({ edad: { $gte: 20 } }, { nombre: 1, edad: 1, _id: 0 }).sort({ edad: -1 }).limit(2)"
    );

    assert.equal(result.type, 'find');
    assert.equal(result.documents.length, 2);
    assert.deepEqual(Object.keys(result.documents[0]).sort(), ['edad', 'nombre']);
    assert.equal(result.documents[0].edad, 25);
    assert.equal(result.documents[1].edad, 24);
});

test('find consulta campos dentro de arreglos embebidos', () => {
    const db = createSchoolDatabase();
    const result = NoSQL.executeCommand(
        db,
        "db.estudiantes.find({ 'cursos.nota': { $gte: 18 } }, { nombre: 1 })"
    );

    const ids = result.documents.map(document => document._id).sort();
    assert.deepEqual(ids, ['est-001', 'est-003', 'est-005', 'est-007']);
});

test('insertOne, updateMany y deleteOne modifican solo el estado', () => {
    const db = createSchoolDatabase();
    const originalCount = db.collections.estudiantes.length;

    const inserted = NoSQL.executeCommand(
        db,
        "db.estudiantes.insertOne({ nombre: 'Nuevo', edad: 18, carrera: 'Administración', promedio: 15, ciudad: 'Lima' })"
    );
    assert.equal(inserted.insertedCount, 1);
    assert.match(inserted.insertedId, /^estudiantes-/);
    assert.equal(db.collections.estudiantes.length, originalCount + 1);

    const updated = NoSQL.executeCommand(
        db,
        "db.estudiantes.updateMany({ carrera: 'Administración' }, { $inc: { promedio: 1 }, $push: { etiquetas: 'actualizado' } })"
    );
    assert.equal(updated.matchedCount, 4);
    assert.equal(updated.modifiedCount, 4);
    assert.equal(
        db.collections.estudiantes.find(document => document._id === 'est-003').promedio,
        18.8
    );

    const deleted = NoSQL.executeCommand(
        db,
        "db.estudiantes.deleteOne({ _id: 'est-008' })"
    );
    assert.equal(deleted.deletedCount, 1);
    assert.equal(db.collections.estudiantes.some(document => document._id === 'est-008'), false);
});

test('aggregate agrupa y ordena documentos', () => {
    const db = createSchoolDatabase();
    const result = NoSQL.executeCommand(
        db,
        "db.estudiantes.aggregate([{ $group: { _id: '$ciudad', total: { $sum: 1 } } }, { $sort: { total: -1 } }])"
    );

    assert.equal(result.type, 'aggregate');
    assert.deepEqual(result.documents.map(document => document._id), ['Lima', 'Arequipa', 'Trujillo', 'Cusco']);
    assert.equal(result.documents[0].total, 3);
});

test('aggregate calcula promedios y campos derivados', () => {
    const db = createSchoolDatabase();
    const result = NoSQL.executeCommand(
        db,
        "db.estudiantes.aggregate([{ $group: { _id: '$carrera', promedio: { $avg: '$promedio' } } }, { $sort: { promedio: -1 } }])"
    );

    assert.equal(result.documents[0]._id, 'Administración');
    assert.match(String(result.documents[0].promedio), /^18\./);
});

test('countDocuments y distinct respetan el filtro', () => {
    const db = createSchoolDatabase();
    const count = NoSQL.executeCommand(db, "db.estudiantes.countDocuments({ ciudad: 'Lima' })");
    const distinct = NoSQL.executeCommand(db, 'db.estudiantes.distinct("carrera")');

    assert.equal(count.count, 3);
    assert.deepEqual(Array.from(distinct.values).sort(), ['Administración', 'Ingeniería de Sistemas']);
});

test('getDangerousCommandReason detecta operaciones destructivas globales', () => {
    assert.equal(NoSQL.getDangerousCommandReason('db.estudiantes.deleteMany({})'), 'deleteMany');
    assert.equal(NoSQL.getDangerousCommandReason('db.estudiantes.updateMany({}, { $set: { activo: true } })'), 'updateMany');
    assert.equal(NoSQL.getDangerousCommandReason('db.estudiantes.drop()'), 'drop');
    assert.equal(NoSQL.getDangerousCommandReason("db.estudiantes.deleteMany({ ciudad: 'Lima' })"), '');
    assert.equal(NoSQL.getDangerousCommandReason("db.estudiantes.find({})"), '');
});

test('el parser rechaza comandos fuera de la sintaxis permitida', () => {
    assert.throws(() => NoSQL.parseCommand('db.estudiantes.find({}); process.exit()'), /Se esperaba eof/);
    assert.throws(() => NoSQL.parseCommand('db.estudiantes.find({ edad: 20 '), /Falta/);
    assert.throws(
        () => NoSQL.executeCommand(createSchoolDatabase(), 'db.estudiantes.deleteEverything({})'),
        /no soportado/i
    );
});

test('el parser bloquea claves peligrosas y evita contaminar prototipos', () => {
    assert.throws(
        () => NoSQL.parseCommand('db.estudiantes.find({ __proto__: { polluted: true } })'),
        /Clave no permitida/
    );
    assert.throws(
        () => NoSQL.executeCommand(createSchoolDatabase(), 'db.__proto__.find({})'),
        /Clave no permitida/
    );
    assert.equal({}.polluted, undefined);
});

test('createDatabase no comparte referencias con el dataset original', () => {
    const db = createSchoolDatabase();
    db.collections.estudiantes[0].nombre = 'Cambiado en la copia';
    assert.notEqual(datasets.escuela.collections.estudiantes[0].nombre, 'Cambiado en la copia');
});
