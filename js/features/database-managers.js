// Información y modal de los gestores de bases de datos.

// GESTORES DE BD - INFORMACION
const dbInfo = {
    'postgresql': {
        title: 'PostgreSQL',
        logo: 'assets/logos/postgresql.png',
        description: 'PostgreSQL es un sistema de gestion de bases de datos relacional orientado a objetos y de codigo abierto, considerado el mas avanzado del mundo.',
        type: 'Relacional (SQL)',
        licencia: 'Open Source',
        sitio: 'postgresql.org',
        caracteristicas: [
            'Soporte completo de SQL',
            'Transacciones ACID',
            'Lenguaje procedimental (PL/pgSQL)',
            'Replicacion y alta disponibilidad',
            'Extensible con extensiones',
            'Ideal para aplicaciones empresariales'
        ],
        empresas: 'Instagram, Apple, Uber, Reddit',
        ventajas: 'Muy robusto, excelente rendimiento, gran comunidad',
        desventajas: 'Curva de aprendizaje pronunciada, consume mas recursos',
        tip: 'Ideal para aplicaciones que requieren consistencia, transacciones complejas y consultas avanzadas.',
        tags: ['Open Source', 'SQL', 'ACID', 'Empresarial']
    },
    'mysql': {
        title: 'MySQL',
        logo: 'assets/logos/mysql.png',
        logoDark: 'assets/logos/mysql-dark.png',
        description: 'MySQL es el sistema de gestion de bases de datos relacional mas popular del mundo. Es conocido por su velocidad, facilidad de uso y amplia adopcion en aplicaciones web.',
        type: 'Relacional (SQL)',
        licencia: 'Open Source',
        sitio: 'mysql.com',
        caracteristicas: [
            'Alto rendimiento y velocidad',
            'Facil de aprender y usar',
            'Integracion con PHP y Apache',
            'Replicacion maestro-esclavo',
            'Multiples motores de almacenamiento',
            'Ideal para aplicaciones web'
        ],
        empresas: 'Facebook, Twitter, YouTube, Netflix, Airbnb',
        ventajas: 'Muy rapido, facil de usar, gran comunidad',
        desventajas: 'Menos funcionalidades que PostgreSQL',
        tip: 'Ideal para aplicaciones web y proyectos que priorizan velocidad y simplicidad.',
        tags: ['Open Source', 'SQL', 'Rapido', 'Web']
    },
    'sqlserver': {
        title: 'SQL Server',
        logo: 'assets/logos/sqlserver.png',
        description: 'Microsoft SQL Server es un sistema de gestion de bases de datos relacional desarrollado por Microsoft. Es ampliamente utilizado en entornos empresariales.',
        type: 'Relacional (SQL)',
        licencia: 'Comercial',
        sitio: 'microsoft.com/sql-server',
        caracteristicas: [
            'Integracion con .NET y Azure',
            'SQL Server Integration Services (SSIS)',
            'Analisis de datos (SSAS) y reportes (SSRS)',
            'Alta disponibilidad y clustering',
            'Columnstore para consultas analiticas',
            'Ideal para empresas .NET'
        ],
        empresas: 'Microsoft, Coca-Cola, Walmart, Adobe, Dell',
        ventajas: 'Excelente integracion con Microsoft',
        desventajas: 'Costo de licencia, requiere Windows',
        tip: 'Ideal para entornos empresariales ya integrados en el ecosistema Microsoft.',
        tags: ['Comercial', 'SQL', 'Empresarial', 'Microsoft']
    },
    'oracle': {
        title: 'Oracle Database',
        logo: 'assets/logos/oracle.png',
        description: 'Oracle Database es el sistema de gestion de bases de datos relacional mas utilizado en grandes corporaciones. Es conocido por su robustez y seguridad.',
        type: 'Relacional (SQL)',
        licencia: 'Comercial',
        sitio: 'oracle.com/database',
        caracteristicas: [
            'Maxima seguridad y conformidad',
            'Oracle Real Application Clusters (RAC)',
            'Particionamiento y paralelismo avanzado',
            'Data Guard para recuperacion',
            'Oracle Exadata para rendimiento extremo',
            'Ideal para bancos y gobierno'
        ],
        empresas: 'Bancos, gobiernos, Amazon, Salesforce, SAP',
        ventajas: 'Muy robusto, seguro y escalable',
        desventajas: 'Muy costoso, complejo de administrar',
        tip: 'Ideal para sistemas criticos que exigen alta seguridad, disponibilidad y soporte corporativo.',
        tags: ['Comercial', 'SQL', 'Empresarial', 'Seguro']
    },
    'mariadb': {
        title: 'MariaDB',
        logo: 'assets/logos/mariadb.png',
        description: 'MariaDB es un fork de MySQL creado por los desarrolladores originales. Ofrece mejoras de rendimiento y nuevas funcionalidades.',
        type: 'Relacional (SQL)',
        licencia: 'Open Source',
        sitio: 'mariadb.org',
        caracteristicas: [
            'Compatibilidad con MySQL',
            'Mejor rendimiento en consultas',
            'Multiples motores de almacenamiento',
            'Galera Cluster para alta disponibilidad',
            'ColumnStore para analisis de datos',
            'Ideal para aplicaciones web modernas'
        ],
        empresas: 'Google, Wikipedia, WordPress, Red Hat, Fedora',
        ventajas: 'Rapido, compatible con MySQL, innovador',
        desventajas: 'Comunidad mas pequeña que MySQL',
        tip: 'Ideal para aplicaciones web que buscan compatibilidad con MySQL y codigo abierto.',
        tags: ['Open Source', 'SQL', 'Rapido', 'Web']
    },
    'sqlite': {
        title: 'SQLite',
        logo: 'assets/logos/sqlite.png',
        logoDark: 'assets/logos/sqlite-dark.png',
        description: 'SQLite es una biblioteca que proporciona un motor de base de datos SQL ligero y sin servidor. Es la base de datos mas utilizada del mundo.',
        type: 'Relacional (SQL)',
        licencia: 'Dominio Publico',
        sitio: 'sqlite.org',
        caracteristicas: [
            'Sin servidor (embebido)',
            'Base de datos autocontenida',
            'Transacciones ACID',
            'Muy ligero (menos de 1MB)',
            'Soporte estandar SQL',
            'Ideal para moviles, IoT y navegadores'
        ],
        empresas: 'Apple, Google, Firefox, Adobe, Autodesk',
        ventajas: 'Muy ligero, facil de usar, sin configuracion',
        desventajas: 'No escalable para grandes volumenes',
        tip: 'Ideal para aplicaciones moviles, prototipos y herramientas locales que no necesitan un servidor.',
        tags: ['Open Source', 'SQL', 'Ligero', 'Embebido']
    },
    // ===== GESTORES NoSQL =====
'mongodb': {
    title: 'MongoDB',
    logo: 'assets/logos/mongodb.png',
    description: 'MongoDB es la base de datos NoSQL documental más popular. Almacena datos en documentos JSON flexibles, ideales para aplicaciones modernas y datos semiestructurados.',
    type: 'NoSQL (Documental)',
    licencia: 'Open Source (SSPL) / Comercial',
    sitio: 'mongodb.com',
    caracteristicas: [
        'Almacenamiento en documentos JSON (BSON)',
        'Esquema flexible (schema-less)',
        'Escalabilidad horizontal (sharding)',
        'Aggregation Pipeline para consultas complejas',
        'Indexación avanzada y geoespacial',
        'Ideal para aplicaciones web y Big Data'
    ],
    empresas: 'Adobe, Google, eBay, Bosch, Accenture',
    ventajas: 'Flexible, escalable, facil de comenzar',
    desventajas: 'No tiene JOINs nativos, consistencia eventual',
    tip: 'Ideal para datos semiestructurados y aplicaciones con esquemas cambiantes.',
    tags: ['NoSQL', 'Documental', 'Escalable', 'JSON']
},
'firebase': {
    title: 'Firebase',
    logo: 'assets/logos/firebase.png',
    description: 'Firebase es la plataforma de Google que incluye una base de datos NoSQL en tiempo real. Es ideal para aplicaciones móviles y web con sincronización instantánea.',
    type: 'NoSQL (Tiempo Real)',
    licencia: 'Comercial (Google)',
    sitio: 'firebase.google.com',
    caracteristicas: [
        'Sincronización en tiempo real',
        'Autenticación integrada (Google, Facebook, etc)',
        'Hosting y funciones serverless',
        'Cloud Firestore para datos escalables',
        'Almacenamiento de archivos',
        'Ideal para apps móviles y web'
    ],
    empresas: 'Google, Lyft, The New York Times, Alibaba',
    ventajas: 'Muy facil de usar, integracion completa',
    desventajas: 'Costo variable, dependencia de Google',
    tip: 'Ideal para apps moviles y web que necesitan sincronizacion en tiempo real.',
    tags: ['NoSQL', 'Tiempo Real', 'Cloud', 'Mobile']
},
'redis': {
    title: 'Redis',
    logo: 'assets/logos/redis.png',
    description: 'Redis es la base de datos clave-valor más rápida del mundo. Es ampliamente utilizada como caché, para sesiones de usuario y para aplicaciones que requieren baja latencia.',
    type: 'NoSQL (Clave-Valor)',
    licencia: 'AGPLv3 (Redis 8+)',
    sitio: 'redis.io',
    caracteristicas: [
        'Alta velocidad (sub-milisegundo)',
        'Estructuras de datos avanzadas (listas, sets, hashes)',
        'Persistencia opcional (RDB/AOF)',
        'Replicación y alta disponibilidad',
        'Soporte para Lua scripting',
        'Ideal para caché, sesiones y colas'
    ],
    empresas: 'Twitter, GitHub, Stack Overflow, Snapchat',
    ventajas: 'Muy rapido, versatil, facil de usar',
    desventajas: 'No soporta consultas complejas',
    tip: 'Ideal para cache, sesiones y datos de acceso ultrarrápido; no para consultas relacionales complejas.',
    tags: ['NoSQL', 'Clave-Valor', 'Rapido', 'Cache']
},
'cassandra': {
    title: 'Cassandra',
    logo: 'assets/logos/cassandra.png',
    description: 'Apache Cassandra es una base de datos NoSQL columnar diseñada para manejar grandes volúmenes de datos distribuidos en múltiples servidores. No tiene puntos de fallo.',
    type: 'NoSQL (Columnar)',
    licencia: 'Open Source (Apache 2.0)',
    sitio: 'cassandra.apache.org',
    caracteristicas: [
        'Arquitectura sin punto de fallo',
        'Escalabilidad horizontal nativa',
        'Alto rendimiento en escrituras',
        'Compresión de datos eficiente',
        'Lenguaje CQL (Cassandra Query Language)',
        'Ideal para Big Data y IoT'
    ],
    empresas: 'Apple, Netflix, Uber, eBay',
    ventajas: 'Muy escalable, alta disponibilidad',
    desventajas: 'Consistencia eventual, complejo de administrar',
    tip: 'Ideal para escrituras masivas y datos distribuidos geograficamente.',
    tags: ['NoSQL', 'Columnar', 'Escalable', 'Big Data']
},
'neo4j': {
    title: 'Neo4j',
    logo: 'assets/logos/neo4j.png',
    description: 'Neo4j es la base de datos de grafos más utilizada del mundo. Permite modelar y consultar relaciones complejas de manera eficiente y natural.',
    type: 'NoSQL (Grafos)',
    licencia: 'Open Source (GPL) / Comercial',
    sitio: 'neo4j.com',
    caracteristicas: [
        'Modelo de datos basado en grafos (nodos, aristas)',
        'Lenguaje de consulta Cypher',
        'Alto rendimiento en consultas de relaciones',
        'Indexación y búsqueda avanzada',
        'Escalable para millones de nodos',
        'Ideal para redes sociales, fraudes, recomendaciones'
    ],
    empresas: 'eBay, Walmart, Cisco, UBS, NASA',
    ventajas: 'Excelente para relaciones complejas, intuitivo',
    desventajas: 'Curva de aprendizaje, no optimizado para datos planos',
    tip: 'Ideal para redes sociales, recomendaciones y analisis de relaciones complejas.',
    tags: ['NoSQL', 'Grafos', 'Relaciones', 'Redes']
},
'elasticsearch': {
    title: 'Elasticsearch',
    logo: 'assets/logos/elasticsearch.png',
    description: 'Elasticsearch es el motor de búsqueda y análisis de datos más popular. Está basado en Lucene y permite consultas full-text en tiempo real.',
    type: 'NoSQL (Busqueda)',
    licencia: 'Elastic License 2.0 / AGPLv3',
    sitio: 'elastic.co',
    caracteristicas: [
        'Búsqueda full-text en tiempo real',
        'Análisis y agregaciones de datos',
        'Escalabilidad horizontal',
        'Indexación automática',
        'Integración con Logstash y Kibana (ELK Stack)',
        'Ideal para logs, busquedas y analisis'
    ],
    empresas: 'Uber, Netflix, eBay, Microsoft, Facebook',
    ventajas: 'Busqueda rapida, analisis potente',
    desventajas: 'No es una BD transaccional, consistencia eventual',
    tip: 'Ideal para busqueda de texto completo, logs y analisis; no como base transaccional principal.',
    tags: ['NoSQL', 'Busqueda', 'Analisis', 'Logs']
}
};

// ABRIR MODAL DE GESTORES
function openDBInfo(dbKey) {
    const info = dbInfo[dbKey];
    if (!info) return;
    
    const modal = document.getElementById('dbModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.innerHTML = `<i class="fas fa-database"></i> ${info.title}`;
    
    let html = `
        <div class="db-logo-large${info.logoDark ? ' has-dark-logo' : ''}">
            <img class="db-logo-light" src="${info.logo}" alt="${info.title}">
            ${info.logoDark ? `<img class="db-logo-dark" src="${info.logoDark}" alt="" aria-hidden="true">` : ''}
        </div>
        
        <p style="font-size:1.05em; color:#444; line-height:1.7;">${info.description}</p>
        
        <div class="info-grid">
            <div class="info-item">
                <div class="label">Tipo</div>
                <div class="value">${info.type}</div>
            </div>
            <div class="info-item">
                <div class="label">Licencia</div>
                <div class="value">${info.licencia}</div>
            </div>
            <div class="info-item">
                <div class="label">Sitio Web</div>
                <div class="value"><a href="https://${info.sitio}" target="_blank" style="color:#336791; text-decoration:none;">${info.sitio}</a></div>
            </div>
            <div class="info-item">
                <div class="label">Empresas que lo usan</div>
                <div class="value" style="font-size:0.85em;">${info.empresas}</div>
            </div>
        </div>
        
        <h3><i class="fas fa-check-circle"></i> Caracteristicas Principales</h3>
        <ul>
            ${info.caracteristicas.map(c => `<li>${c}</li>`).join('')}
        </ul>
        
        <h3><i class="fas fa-balance-scale"></i> Ventajas y Desventajas</h3>
        <div class="info-grid">
            <div class="info-item" style="border-left-color: #28a745;">
                <div class="label" style="color: #28a745;">Ventajas</div>
                <div class="value" style="font-size:0.9em;">${info.ventajas}</div>
            </div>
            <div class="info-item" style="border-left-color: #dc3545;">
                <div class="label" style="color: #dc3545;">Desventajas</div>
                <div class="value" style="font-size:0.9em;">${info.desventajas}</div>
            </div>
        </div>
        
        <h3><i class="fas fa-tags"></i> Etiquetas</h3>
        <div class="badge-container">
            ${info.tags.map(tag => {
                const colorMap = {
                    'Open Source': 'badge-success',
                    'Comercial': 'badge-warning',
                    'SQL': 'badge-info',
                    'ACID': 'badge-info',
                    'Empresarial': 'badge-danger',
                    'Rapido': 'badge-success',
                    'Web': 'badge-info',
                    'Microsoft': 'badge-info',
                    'Seguro': 'badge-success',
                    'Ligero': 'badge-info',
                    'Embebido': 'badge-secondary'
                };
                const badgeClass = colorMap[tag] || 'badge-secondary';
                return `<span class="badge ${badgeClass}">${tag}</span>`;
            }).join('')}
        </div>
        
        <div style="margin-top: 15px; padding: 12px; background: #f0f4ff; border-radius: 8px; border-left: 4px solid #336791; font-size:0.9em; color:#555;">
            <i class="fas fa-lightbulb" style="color: #336791;"></i>
            <strong>Tip:</strong> ${info.tip}
        </div>

        ${window.INSTALL_GUIDES?.[dbKey] ? `
            <div class="db-install-cta">
                <div>
                    <strong>¿Quieres instalarlo en tu equipo?</strong>
                    <p>Guía paso a paso para Windows, macOS, Linux o Docker.</p>
                </div>
                <button type="button" class="btn-primary" onclick="openInstallFromDBInfo('${escapeHtml(dbKey)}')">
                    <i class="fas fa-download"></i> Cómo instalarlo
                </button>
            </div>
        ` : ''}
    `;
    
    body.innerHTML = html;
    openModal(modal);
}

function closeDBModal() {
    closeModal(document.getElementById('dbModal'));
}
