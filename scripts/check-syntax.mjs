import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const files = [];

function collect(directory) {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory)) {
        const fullPath = join(directory, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
            collect(fullPath);
        } else if (entry.endsWith('.js') || entry.endsWith('.mjs')) {
            files.push(fullPath);
        }
    }
}

collect(join(projectRoot, 'js'));
collect(join(projectRoot, 'scripts'));
collect(join(projectRoot, 'netlify', 'functions'));

for (const entry of readdirSync(projectRoot)) {
    if (entry.endsWith('.js')) files.push(join(projectRoot, entry));
}

for (const file of files) {
    try {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (error) {
        console.error(`Error de sintaxis en ${relative(projectRoot, file)}`);
        if (error.stderr) process.stderr.write(error.stderr);
        process.exit(1);
    }
}

console.log(`Sintaxis verificada en ${files.length} archivos.`);
