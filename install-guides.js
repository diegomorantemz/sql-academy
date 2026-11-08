// Guías de instalación para los gestores de bases de datos.
// El contenido se mantiene separado de la interfaz para facilitar su actualización.
window.INSTALL_GUIDES = {
    sqlite: {
        id: 'sqlite',
        name: 'SQLite',
        logo: 'assets/logos/sqlite.png',
        logoDark: 'assets/logos/sqlite-dark.png',
        type: 'SQL',
        difficulty: 'Fácil',
        time: '5 min',
        recommended: true,
        summary: 'No necesita servidor: la base de datos vive en un archivo local.',
        officialUrl: 'https://www.sqlite.org/download.html',
        docsUrl: 'https://www.sqlite.org/docs.html',
        requirements: ['Ninguno para empezar'],
        clients: [
            { name: 'DB Browser for SQLite', url: 'https://sqlitebrowser.org/dl/' }
        ],
        cloudAlternative: null,
        paths: [
            {
                id: 'windows',
                label: 'Windows',
                recommended: true,
                steps: [
                    {
                        title: 'Descarga DB Browser for SQLite',
                        body: 'Es un cliente visual gratuito para abrir y editar archivos SQLite. No necesitas instalar un servidor.',
                        link: { label: 'Descargar DB Browser', url: 'https://sqlitebrowser.org/dl/' }
                    },
                    {
                        title: 'Instala el programa',
                        body: 'Ejecuta el instalador y deja las opciones por defecto. Al terminar, abre DB Browser.'
                    },
                    {
                        title: 'Crea o abre una base',
                        body: 'Usa «Nueva base de datos» o abre un archivo .sqlite. La base quedará guardada en ese archivo.'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba que puedes abrir la base',
                        body: 'Crea una tabla de prueba y ejecuta una consulta SELECT desde la pestaña «Ejecutar SQL».'
                    }
                ],
                notes: ['SQLite no usa usuario, contraseña ni puerto.']
            },
            {
                id: 'macos',
                label: 'macOS',
                recommended: false,
                steps: [
                    {
                        title: 'Instala DB Browser con Homebrew',
                        body: 'Si tienes Homebrew, instala el cliente visual desde la terminal.',
                        code: 'brew install --cask db-browser-for-sqlite'
                    },
                    {
                        title: 'Abre la aplicación',
                        body: 'Busca DB Browser for SQLite en Launchpad y crea una base nueva.'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la instalación',
                        body: 'Abre un archivo .sqlite y ejecuta una consulta de prueba.'
                    }
                ],
                notes: ['También puedes descargar el instalador desde la web oficial.']
            },
            {
                id: 'linux',
                label: 'Linux',
                recommended: false,
                steps: [
                    {
                        title: 'Instala SQLite y el cliente visual',
                        body: 'En Ubuntu o Debian puedes usar el gestor de paquetes.',
                        code: 'sudo apt update && sudo apt install sqlite3 sqlitebrowser'
                    },
                    {
                        title: 'Crea una base de prueba',
                        body: 'Abre la terminal y crea un archivo SQLite nuevo.',
                        code: 'sqlite3 practica.sqlite'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la versión',
                        body: 'La terminal debe responder con una versión de SQLite.',
                        code: 'sqlite3 --version'
                    }
                ],
                notes: ['Puedes abrir el archivo practica.sqlite con DB Browser.']
            }
        ],
        commonErrors: [
            {
                problem: 'El archivo está bloqueado',
                solution: 'Cierra otras aplicaciones que estén usando la misma base SQLite.'
            },
            {
                problem: 'No encuentras el archivo .sqlite',
                solution: 'Comprueba la carpeta desde la que se creó o usa la ruta absoluta al abrirlo.'
            }
        ],
        security: [
            'SQLite es un archivo local: no lo publiques en una carpeta web pública.',
            'Haz copias de seguridad antes de editar datos importantes.'
        ],
        lastReviewed: '2026-11'
    },

    postgresql: {
        id: 'postgresql',
        name: 'PostgreSQL',
        logo: 'assets/logos/postgresql.png',
        type: 'SQL',
        difficulty: 'Media',
        time: '15-20 min',
        recommended: true,
        summary: 'Base de datos relacional robusta, gratuita y muy usada en la industria.',
        officialUrl: 'https://www.postgresql.org/download/',
        docsUrl: 'https://www.postgresql.org/docs/',
        requirements: ['Permisos de administrador', 'Opcional: Docker'],
        clients: [
            { name: 'pgAdmin', url: 'https://www.pgadmin.org/download/' },
            { name: 'DBeaver', url: 'https://dbeaver.io/download/' }
        ],
        cloudAlternative: null,
        paths: [
            {
                id: 'windows',
                label: 'Windows',
                recommended: true,
                steps: [
                    {
                        title: 'Descarga el instalador',
                        body: 'Entra en la página oficial de Windows y descarga el instalador interactivo de PostgreSQL.',
                        link: { label: 'Descargar para Windows', url: 'https://www.postgresql.org/download/windows/' }
                    },
                    {
                        title: 'Selecciona los componentes',
                        body: 'Instala PostgreSQL Server y pgAdmin. Puedes dejar el puerto 5432 salvo que ya esté ocupado.'
                    },
                    {
                        title: 'Define la contraseña local',
                        body: 'Usa una contraseña de práctica, por ejemplo CambiaEstaClave123. No reutilices una contraseña real.'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba psql',
                        body: 'Abre PowerShell o CMD y ejecuta:',
                        code: 'psql --version'
                    },
                    {
                        title: 'Abre pgAdmin',
                        body: 'Conecta a localhost:5432 con el usuario postgres y la contraseña que creaste.'
                    }
                ],
                notes: ['Si psql no aparece, añade la carpeta bin de PostgreSQL al PATH.']
            },
            {
                id: 'macos',
                label: 'macOS',
                recommended: false,
                steps: [
                    {
                        title: 'Instala PostgreSQL con Homebrew',
                        body: 'La forma más rápida si ya usas Homebrew.',
                        code: 'brew install postgresql@16'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Arranca PostgreSQL como servicio local.',
                        code: 'brew services start postgresql@16'
                    },
                    {
                        title: 'Crea una base de práctica',
                        body: 'Crea una base de datos para tus pruebas.',
                        code: 'createdb sql_academy'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la conexión',
                        body: 'Abre la consola de PostgreSQL.',
                        code: 'psql postgres'
                    }
                ],
                notes: ['También existe Postgres.app, una opción visual para macOS.']
            },
            {
                id: 'linux',
                label: 'Linux',
                recommended: false,
                steps: [
                    {
                        title: 'Instala PostgreSQL',
                        body: 'En Ubuntu o Debian actualiza los paquetes e instala el servidor.',
                        code: 'sudo apt update && sudo apt install postgresql postgresql-contrib'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Activa PostgreSQL y comprueba su estado.',
                        code: 'sudo systemctl enable --now postgresql'
                    },
                    {
                        title: 'Entra como usuario postgres',
                        body: 'El instalador crea el usuario administrador postgres.',
                        code: 'sudo -u postgres psql'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la versión',
                        body: 'La terminal debe mostrar la versión instalada.',
                        code: 'psql --version'
                    }
                ],
                notes: ['En otras distribuciones cambia apt por el gestor de paquetes correspondiente.']
            },
            {
                id: 'docker',
                label: 'Docker',
                recommended: false,
                steps: [
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia local con un volumen para conservar los datos.',
                        code: 'docker run --name sql-academy-postgres -e POSTGRES_PASSWORD=CambiaEstaClave123 -p 5432:5432 -v sql-academy-pgdata:/var/lib/postgresql/data -d postgres:16'
                    },
                    {
                        title: 'Espera a que esté listo',
                        body: 'Comprueba los logs hasta que PostgreSQL indique que está listo para aceptar conexiones.',
                        code: 'docker logs sql-academy-postgres'
                    }
                ],
                verify: [
                    {
                        title: 'Conecta con psql',
                        body: 'Conéctate al contenedor desde tu equipo.',
                        code: 'psql -h localhost -U postgres -d postgres'
                    }
                ],
                notes: ['Puedes usar pgAdmin apuntando a localhost:5432.']
            }
        ],
        commonErrors: [
            {
                problem: 'El puerto 5432 ya está en uso',
                solution: 'Cambia el puerto al instalar o detén el otro servicio que lo esté usando.'
            },
            {
                problem: 'psql no se reconoce como comando',
                solution: 'Añade la carpeta bin de PostgreSQL a la variable PATH.'
            },
            {
                problem: 'No recuerdo la contraseña de postgres',
                solution: 'Restablece la contraseña desde la consola local o reinstala la instancia de práctica.'
            }
        ],
        security: [
            'Usa una contraseña distinta para cada proyecto.',
            'No expongas el puerto 5432 directamente a internet.',
            'Mantén PostgreSQL actualizado.'
        ],
        lastReviewed: '2026-11'
    },

    mysql: {
        id: 'mysql',
        name: 'MySQL',
        logo: 'assets/logos/mysql.png',
        logoDark: 'assets/logos/mysql-dark.png',
        type: 'SQL',
        difficulty: 'Media',
        time: '15-20 min',
        recommended: true,
        summary: 'El gestor relacional más popular para aplicaciones web y proyectos de aprendizaje.',
        officialUrl: 'https://dev.mysql.com/downloads/installer/',
        docsUrl: 'https://dev.mysql.com/doc/',
        requirements: ['Permisos de administrador', 'Opcional: Docker'],
        clients: [
            { name: 'MySQL Workbench', url: 'https://dev.mysql.com/downloads/workbench/' },
            { name: 'DBeaver', url: 'https://dbeaver.io/download/' }
        ],
        cloudAlternative: null,
        paths: [
            {
                id: 'windows',
                label: 'Windows',
                recommended: true,
                steps: [
                    {
                        title: 'Descarga MySQL Installer',
                        body: 'Descarga el instalador oficial de MySQL para Windows.',
                        link: { label: 'Descargar MySQL Installer', url: 'https://dev.mysql.com/downloads/installer/' }
                    },
                    {
                        title: 'Selecciona Server y Workbench',
                        body: 'Elige MySQL Server y MySQL Workbench. Deja el puerto 3306 si está disponible.'
                    },
                    {
                        title: 'Configura el usuario root',
                        body: 'Crea una contraseña de práctica y guarda la configuración de autenticación.'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la versión',
                        body: 'Abre CMD o PowerShell y ejecuta:',
                        code: 'mysql --version'
                    },
                    {
                        title: 'Abre Workbench',
                        body: 'Conecta a localhost:3306 y ejecuta una consulta sencilla.'
                    }
                ],
                notes: ['Si mysql no aparece, añade la carpeta bin de MySQL al PATH.']
            },
            {
                id: 'macos',
                label: 'macOS',
                recommended: false,
                steps: [
                    {
                        title: 'Instala MySQL con Homebrew',
                        body: 'Instala el servidor desde la terminal.',
                        code: 'brew install mysql'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Arranca MySQL como servicio local.',
                        code: 'brew services start mysql'
                    },
                    {
                        title: 'Protege la instalación',
                        body: 'Ejecuta el asistente para definir la contraseña de root y eliminar configuraciones inseguras.',
                        code: 'mysql_secure_installation'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la conexión',
                        body: 'Entra a la consola de MySQL.',
                        code: 'mysql -u root -p'
                    }
                ],
                notes: ['También puedes instalar MySQL Workbench desde la web oficial.']
            },
            {
                id: 'linux',
                label: 'Linux',
                recommended: false,
                steps: [
                    {
                        title: 'Instala MySQL Server',
                        body: 'En Ubuntu o Debian instala el servidor desde los repositorios.',
                        code: 'sudo apt update && sudo apt install mysql-server'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Activa MySQL y comprueba que está funcionando.',
                        code: 'sudo systemctl enable --now mysql'
                    },
                    {
                        title: 'Protege la instalación',
                        body: 'Ejecuta el asistente de configuración inicial.',
                        code: 'sudo mysql_secure_installation'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba el estado',
                        body: 'El servicio debe aparecer como activo.',
                        code: 'sudo systemctl status mysql'
                    }
                ],
                notes: ['En Fedora o Arch Linux cambia el comando por el de tu distribución.']
            },
            {
                id: 'docker',
                label: 'Docker',
                recommended: false,
                steps: [
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia de MySQL con un volumen local.',
                        code: 'docker run --name sql-academy-mysql -e MYSQL_ROOT_PASSWORD=CambiaEstaClave123 -p 3306:3306 -v sql-academy-mysql-data:/var/lib/mysql -d mysql:8'
                    },
                    {
                        title: 'Espera a que esté listo',
                        body: 'Revisa los logs hasta que MySQL acepte conexiones.',
                        code: 'docker logs sql-academy-mysql'
                    }
                ],
                verify: [
                    {
                        title: 'Conecta con el cliente',
                        body: 'Usa MySQL Workbench o la terminal con localhost:3306.',
                        code: 'mysql -h 127.0.0.1 -u root -p'
                    }
                ],
                notes: ['El volumen evita perder los datos al detener el contenedor.']
            }
        ],
        commonErrors: [
            {
                problem: 'El puerto 3306 está ocupado',
                solution: 'Detén el otro servicio o cambia el puerto durante la instalación.'
            },
            {
                problem: 'Access denied for user root',
                solution: 'Comprueba la contraseña y el método de autenticación configurado.'
            },
            {
                problem: 'El servicio no inicia',
                solution: 'Revisa el estado con systemctl y los logs de MySQL.'
            }
        ],
        security: [
            'No uses root para las aplicaciones; crea un usuario específico.',
            'Ejecuta mysql_secure_installation después de instalar.',
            'Evita exponer MySQL directamente a internet.'
        ],
        lastReviewed: '2026-11'
    },

    sqlserver: {
        id: 'sqlserver',
        name: 'SQL Server',
        logo: 'assets/logos/sqlserver.png',
        type: 'SQL',
        difficulty: 'Media',
        time: '20-30 min',
        recommended: false,
        summary: 'Base de datos de Microsoft orientada a entornos empresariales y .NET.',
        officialUrl: 'https://www.microsoft.com/sql-server/sql-server-downloads',
        docsUrl: 'https://learn.microsoft.com/sql/sql-server/',
        requirements: ['Windows para la instalación nativa', 'Docker para macOS/Linux', 'Al menos 2 GB de RAM para el contenedor'],
        clients: [
            { name: 'SQL Server Management Studio', url: 'https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms' },
            { name: 'Azure Data Studio', url: 'https://learn.microsoft.com/azure-data-studio/download-azure-data-studio' }
        ],
        cloudAlternative: null,
        paths: [
            {
                id: 'windows',
                label: 'Windows',
                recommended: true,
                steps: [
                    {
                        title: 'Descarga SQL Server Express o Developer',
                        body: 'Express es gratuita para aprendizaje. Developer tiene más funciones y también es gratuita para desarrollo.',
                        link: { label: 'Descargar SQL Server', url: 'https://www.microsoft.com/sql-server/sql-server-downloads' }
                    },
                    {
                        title: 'Ejecuta el instalador',
                        body: 'Elige la instalación básica y espera a que termine. La instancia suele llamarse SQLEXPRESS.'
                    },
                    {
                        title: 'Instala SQL Server Management Studio',
                        body: 'SSMS es el cliente visual para conectarte, crear bases y ejecutar consultas.',
                        link: { label: 'Descargar SSMS', url: 'https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms' }
                    }
                ],
                verify: [
                    {
                        title: 'Conecta con SSMS',
                        body: 'Abre SSMS y usa el servidor localhost\\SQLEXPRESS o localhost, según la instancia.'
                    },
                    {
                        title: 'Ejecuta una consulta',
                        body: 'Crea una base de práctica y ejecuta SELECT 1; en una consulta nueva.'
                    }
                ],
                notes: ['La autenticación de Windows suele ser la opción más sencilla en local.']
            },
            {
                id: 'docker',
                label: 'Docker (macOS/Linux)',
                recommended: false,
                steps: [
                    {
                        title: 'Arranca el contenedor',
                        body: 'Usa una contraseña SA que cumpla los requisitos de complejidad.',
                        code: 'docker run --name sql-academy-sqlserver -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=CambiaEstaClave123!" -p 1433:1433 -v sql-academy-mssql-data:/var/opt/mssql -d mcr.microsoft.com/mssql/server:2022-latest'
                    },
                    {
                        title: 'Espera a que SQL Server inicie',
                        body: 'El primer arranque puede tardar un poco. Revisa los logs.',
                        code: 'docker logs sql-academy-sqlserver'
                    }
                ],
                verify: [
                    {
                        title: 'Conecta desde SSMS o Azure Data Studio',
                        body: 'Usa servidor localhost, puerto 1433, usuario sa y la contraseña definida.'
                    }
                ],
                notes: ['En macOS y Linux necesitas Docker Desktop o Docker Engine.']
            }
        ],
        commonErrors: [
            {
                problem: 'El contenedor se detiene al iniciar',
                solution: 'Revisa la memoria disponible; SQL Server necesita al menos 2 GB para funcionar con comodidad.'
            },
            {
                problem: 'No puedo conectar a localhost',
                solution: 'Comprueba el puerto 1433, el nombre de la instancia y que el servicio esté iniciado.'
            },
            {
                problem: 'La contraseña SA es rechazada',
                solution: 'Usa una contraseña con mayúsculas, minúsculas, números y símbolos.'
            }
        ],
        security: [
            'No uses la cuenta sa para aplicaciones reales.',
            'Mantén SQL Server en localhost mientras practicas.',
            'No compartas la contraseña SA en capturas o repositorios.'
        ],
        lastReviewed: '2026-11'
    },

    mongodb: {
        id: 'mongodb',
        name: 'MongoDB',
        logo: 'assets/logos/mongodb.png',
        type: 'NoSQL',
        difficulty: 'Fácil-media',
        time: '10-20 min',
        recommended: true,
        summary: 'Base de datos documental; puedes empezar en la nube con Atlas o instalar el servidor local.',
        officialUrl: 'https://www.mongodb.com/try/download/community',
        docsUrl: 'https://www.mongodb.com/docs/',
        requirements: ['Cuenta gratuita para Atlas', 'Opcional: Docker'],
        clients: [
            { name: 'MongoDB Compass', url: 'https://www.mongodb.com/products/compass' }
        ],
        cloudAlternative: {
            label: 'MongoDB Atlas',
            url: 'https://www.mongodb.com/atlas/database',
            note: 'Recomendado para empezar sin instalar un servidor local ni configurar Docker.'
        },
        paths: [
            {
                id: 'windows',
                label: 'Windows',
                recommended: true,
                steps: [
                    {
                        title: 'Descarga MongoDB Community Server',
                        body: 'Descarga el instalador oficial para Windows.',
                        link: { label: 'Descargar MongoDB Community', url: 'https://www.mongodb.com/try/download/community' }
                    },
                    {
                        title: 'Instala como servicio',
                        body: 'Durante la instalación puedes dejar MongoDB como servicio local y conservar la configuración por defecto.'
                    },
                    {
                        title: 'Instala MongoDB Compass',
                        body: 'Compass es el cliente visual para explorar bases y colecciones.',
                        link: { label: 'Descargar Compass', url: 'https://www.mongodb.com/products/compass' }
                    }
                ],
                verify: [
                    {
                        title: 'Conecta con Compass',
                        body: 'Usa la cadena mongodb://localhost:27017 y comprueba que aparece la conexión.'
                    },
                    {
                        title: 'Crea una base de prueba',
                        body: 'Crea una base llamada sql_academy y una colección estudiantes. Inserta un documento.'
                    }
                ],
                notes: ['Si el servicio no arranca, revisa el estado de MongoDB en Servicios de Windows.']
            },
            {
                id: 'macos',
                label: 'macOS',
                recommended: false,
                steps: [
                    {
                        title: 'Instala MongoDB con Homebrew',
                        body: 'Añade el repositorio oficial y instala la versión Community.',
                        code: 'brew tap mongodb/brew && brew install mongodb-community@7.0'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Arranca MongoDB como servicio local.',
                        code: 'brew services start mongodb-community@7.0'
                    }
                ],
                verify: [
                    {
                        title: 'Conecta con Compass',
                        body: 'Usa mongodb://localhost:27017 en MongoDB Compass.'
                    }
                ],
                notes: ['También puedes usar MongoDB Atlas y evitar la instalación local.']
            },
            {
                id: 'docker',
                label: 'Linux / Docker',
                recommended: false,
                steps: [
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia local con un volumen para los datos.',
                        code: 'docker run --name sql-academy-mongo -p 27017:27017 -v sql-academy-mongo-data:/data/db -d mongo:7'
                    },
                    {
                        title: 'Comprueba el estado',
                        body: 'Revisa que el contenedor siga en ejecución.',
                        code: 'docker ps'
                    }
                ],
                verify: [
                    {
                        title: 'Conecta con Compass',
                        body: 'Abre Compass y usa mongodb://localhost:27017.'
                    }
                ],
                notes: ['También puedes instalar MongoDB Community desde los repositorios de tu distribución.']
            }
        ],
        commonErrors: [
            {
                problem: 'Connection refused en localhost:27017',
                solution: 'Comprueba que el servicio o el contenedor estén iniciados.'
            },
            {
                problem: 'Atlas no permite la conexión',
                solution: 'Añade tu IP actual a la lista de accesos permitidos de Atlas.'
            },
            {
                problem: 'La URI de conexión falla',
                solution: 'Copia la cadena exacta desde Atlas y sustituye el usuario y la contraseña.'
            }
        ],
        security: [
            'No publiques cadenas de conexión con usuario y contraseña.',
            'En Atlas, limita las IPs permitidas.',
            'En local, mantén MongoDB en localhost mientras practicas.'
        ],
        lastReviewed: '2026-11'
    },

    oracle: {
        id: 'oracle',
        name: 'Oracle Database',
        logo: 'assets/logos/oracle.png',
        type: 'SQL',
        difficulty: 'Alta',
        time: '30-60 min',
        recommended: false,
        summary: 'Base de datos empresarial muy completa; la instalación local es la más pesada de esta lista.',
        officialUrl: 'https://www.oracle.com/database/free/get-started/',
        docsUrl: 'https://docs.oracle.com/en/database/',
        requirements: ['Equipo con recursos suficientes', 'Permisos de administrador', 'Docker para una alternativa más simple'],
        clients: [
            { name: 'Oracle SQL Developer', url: 'https://www.oracle.com/database/sqldeveloper/' }
        ],
        cloudAlternative: {
            label: 'Oracle Live SQL',
            url: 'https://livesql.oracle.com/',
            note: 'Practica en el navegador sin instalar Oracle Database. Es la opción más rápida para empezar.'
        },
        paths: [
            {
                id: 'windows',
                label: 'Windows',
                recommended: false,
                steps: [
                    {
                        title: 'Descarga Oracle Database Free',
                        body: 'Usa la edición gratuita para aprendizaje y desarrollo local.',
                        link: { label: 'Descargar Oracle Database Free', url: 'https://www.oracle.com/database/free/get-started/' }
                    },
                    {
                        title: 'Ejecuta el instalador',
                        body: 'Sigue el asistente, define una contraseña para los usuarios administrativos y conserva el puerto 1521 si está libre.'
                    },
                    {
                        title: 'Instala SQL Developer',
                        body: 'SQL Developer es el cliente visual para conectarte y ejecutar consultas.',
                        link: { label: 'Descargar SQL Developer', url: 'https://www.oracle.com/database/sqldeveloper/' }
                    }
                ],
                verify: [
                    {
                        title: 'Conecta con SQL Developer',
                        body: 'Usa localhost, puerto 1521, servicio FREEPDB1 y el usuario SYSTEM o el usuario que hayas creado.'
                    }
                ],
                notes: ['La instalación local consume bastante espacio y memoria.']
            },
            {
                id: 'linux',
                label: 'Linux',
                recommended: false,
                steps: [
                    {
                        title: 'Descarga Oracle Database Free',
                        body: 'Sigue las instrucciones oficiales para tu distribución y arquitectura.',
                        link: { label: 'Guía oficial de instalación', url: 'https://www.oracle.com/database/free/get-started/' }
                    },
                    {
                        title: 'Configura el entorno',
                        body: 'El instalador puede pedir usuarios del sistema, grupos y variables de entorno. Revisa los requisitos oficiales.'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la conexión',
                        body: 'Conecta con SQL Developer a localhost:1521 y al servicio FREEPDB1.'
                    }
                ],
                notes: ['En muchos equipos de práctica resulta más sencillo usar Docker o Live SQL.']
            },
            {
                id: 'docker',
                label: 'Docker',
                recommended: true,
                steps: [
                    {
                        title: 'Descarga la imagen',
                        body: 'La imagen oficial de Oracle Database Free puede tardar en descargarse.',
                        code: 'docker pull container-registry.oracle.com/database/free:latest'
                    },
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia local con un volumen para conservar los datos.',
                        code: 'docker run --name sql-academy-oracle -p 1521:1521 -e ORACLE_PASSWORD=CambiaEstaClave123 -v sql-academy-oracle-data:/opt/oracle/oradata -d container-registry.oracle.com/database/free:latest'
                    },
                    {
                        title: 'Espera el primer arranque',
                        body: 'La primera inicialización puede tardar varios minutos. Revisa los logs.',
                        code: 'docker logs -f sql-academy-oracle'
                    }
                ],
                verify: [
                    {
                        title: 'Conecta con SQL Developer',
                        body: 'Usa localhost, puerto 1521, servicio FREEPDB1 y la contraseña definida.'
                    }
                ],
                notes: [
                    'La imagen y la base ocupan bastante espacio en disco.',
                    'Si docker pull falla, inicia sesión en container-registry.oracle.com y acepta las condiciones de la imagen.'
                ]
            }
        ],
        commonErrors: [
            {
                problem: 'El contenedor tarda mucho en iniciar',
                solution: 'Es normal la primera vez. Revisa los logs y espera a que termine la inicialización.'
            },
            {
                problem: 'No puedo conectar al servicio',
                solution: 'Comprueba el puerto 1521 y usa el nombre de servicio FREEPDB1.'
            },
            {
                problem: 'El equipo se queda sin memoria',
                solution: 'Cierra otras aplicaciones o usa Oracle Live SQL en lugar de una instalación local.'
            }
        ],
        security: [
            'No uses contraseñas de ejemplo en entornos reales.',
            'No expongas el puerto 1521 a internet.',
            'Revisa las condiciones de licencia de Oracle antes de usar la base en producción.'
        ],
        lastReviewed: '2026-11'
    },

    mariadb: {
        id: 'mariadb',
        name: 'MariaDB',
        logo: 'assets/logos/mariadb.png',
        type: 'SQL',
        difficulty: 'Media',
        time: '15-20 min',
        recommended: false,
        summary: 'Alternativa open source compatible con MySQL, mantenida por la comunidad y muy usada en hosting y aplicaciones web.',
        officialUrl: 'https://mariadb.org/download/',
        docsUrl: 'https://mariadb.com/kb/en/documentation/',
        requirements: ['Permisos de administrador', 'Opcional: Docker'],
        clients: [
            { name: 'DBeaver', url: 'https://dbeaver.io/download/' },
            { name: 'HeidiSQL', url: 'https://www.heidisql.com/download.php' }
        ],
        cloudAlternative: null,
        paths: [
            {
                id: 'windows',
                label: 'Windows',
                recommended: true,
                steps: [
                    {
                        title: 'Descarga MariaDB Server',
                        body: 'Entra en la página oficial, elige Windows y descarga el instalador MSI de MariaDB Server.',
                        link: { label: 'Descargar MariaDB', url: 'https://mariadb.org/download/' }
                    },
                    {
                        title: 'Ejecuta el instalador',
                        body: 'Selecciona Server y HeidiSQL si quieres un cliente visual. Deja el puerto 3306 salvo que ya esté ocupado.'
                    },
                    {
                        title: 'Define la contraseña de root',
                        body: 'Usa una contraseña de práctica y guárdala. No reutilices una contraseña real.'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la versión',
                        body: 'Abre PowerShell o CMD y ejecuta:',
                        code: 'mariadb --version'
                    },
                    {
                        title: 'Conecta con HeidiSQL',
                        body: 'Crea una conexión a localhost:3306 con el usuario root y la contraseña definida.'
                    }
                ],
                notes: ['Si mariadb no aparece en la terminal, añade la carpeta bin de MariaDB al PATH.']
            },
            {
                id: 'macos',
                label: 'macOS',
                recommended: false,
                steps: [
                    {
                        title: 'Instala MariaDB con Homebrew',
                        body: 'Instala el servidor desde la terminal.',
                        code: 'brew install mariadb'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Arranca MariaDB como servicio local.',
                        code: 'brew services start mariadb'
                    },
                    {
                        title: 'Protege la instalación',
                        body: 'Ejecuta el asistente para definir la contraseña de root y eliminar configuraciones inseguras.',
                        code: 'mariadb-secure-installation'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la versión',
                        body: 'La terminal debe mostrar la versión instalada.',
                        code: 'mariadb --version'
                    },
                    {
                        title: 'Entra a la consola',
                        body: 'Conecta con el usuario root.',
                        code: 'mariadb -u root -p'
                    }
                ],
                notes: ['En instalaciones antiguas el comando puede aparecer como mysql_secure_installation.']
            },
            {
                id: 'linux',
                label: 'Linux',
                recommended: false,
                steps: [
                    {
                        title: 'Instala MariaDB Server',
                        body: 'En Ubuntu o Debian actualiza los paquetes e instala el servidor.',
                        code: 'sudo apt update && sudo apt install mariadb-server'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Activa MariaDB y comprueba que está funcionando.',
                        code: 'sudo systemctl enable --now mariadb'
                    },
                    {
                        title: 'Protege la instalación',
                        body: 'Ejecuta el asistente de configuración inicial.',
                        code: 'sudo mariadb-secure-installation'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba el estado',
                        body: 'El servicio debe aparecer como activo.',
                        code: 'sudo systemctl status mariadb'
                    },
                    {
                        title: 'Abre la consola',
                        body: 'El usuario root del sistema puede entrar con autenticación local.',
                        code: 'sudo mariadb'
                    }
                ],
                notes: ['En Fedora o Arch Linux cambia apt por el gestor de paquetes correspondiente.']
            },
            {
                id: 'docker',
                label: 'Docker',
                recommended: false,
                steps: [
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia de MariaDB con un volumen para conservar los datos.',
                        code: 'docker run --name sql-academy-mariadb -e MARIADB_ROOT_PASSWORD=CambiaEstaClave123 -p 3306:3306 -v sql-academy-mariadb-data:/var/lib/mysql -d mariadb:11'
                    },
                    {
                        title: 'Espera a que esté listo',
                        body: 'Revisa los logs hasta que MariaDB acepte conexiones.',
                        code: 'docker logs sql-academy-mariadb'
                    }
                ],
                verify: [
                    {
                        title: 'Conecta con el cliente',
                        body: 'Usa HeidiSQL o la terminal con localhost:3306.',
                        code: 'mariadb -h 127.0.0.1 -u root -p'
                    }
                ],
                notes: ['El volumen evita perder los datos al detener el contenedor.']
            }
        ],
        commonErrors: [
            {
                problem: 'El puerto 3306 ya está en uso',
                solution: 'Detén el otro servicio o cambia el puerto durante la instalación.'
            },
            {
                problem: 'Access denied for user root',
                solution: 'Comprueba la contraseña y el método de autenticación configurado.'
            },
            {
                problem: 'El servicio no inicia',
                solution: 'Revisa el estado con systemctl y los logs de MariaDB.'
            }
        ],
        security: [
            'No uses root para las aplicaciones; crea un usuario específico.',
            'Ejecuta mariadb-secure-installation después de instalar.',
            'Evita exponer MariaDB directamente a internet.',
            'Haz copias de seguridad antes de cambiar datos importantes.'
        ],
        lastReviewed: '2026-11'
    },

    redis: {
        id: 'redis',
        name: 'Redis',
        logo: 'assets/logos/redis.png',
        type: 'NoSQL',
        difficulty: 'Fácil-media',
        time: '10-15 min',
        recommended: true,
        summary: 'Base de datos clave-valor en memoria, ideal para caché, sesiones, colas y contadores.',
        officialUrl: 'https://redis.io/downloads/',
        docsUrl: 'https://redis.io/docs/latest/',
        requirements: ['Opcional: WSL2 en Windows', 'Opcional: Docker'],
        clients: [
            { name: 'Redis Insight', url: 'https://redis.io/insight/' }
        ],
        cloudAlternative: {
            label: 'Redis Cloud',
            url: 'https://redis.io/cloud/',
            note: 'Plan gratuito para practicar sin instalar un servidor local.'
        },
        paths: [
            {
                id: 'windows',
                label: 'Windows (WSL2)',
                recommended: false,
                steps: [
                    {
                        title: 'Activa WSL2',
                        body: 'Redis no tiene una versión nativa oficial para Windows. Abre PowerShell como administrador y activa WSL2.',
                        code: 'wsl --install'
                    },
                    {
                        title: 'Instala Redis en Ubuntu',
                        body: 'Abre la terminal de Ubuntu y actualiza los paquetes.',
                        code: 'sudo apt update && sudo apt install redis-server'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Arranca Redis dentro de la distribución de Linux.',
                        code: 'sudo service redis-server start'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la conexión',
                        body: 'La terminal debe responder PONG.',
                        code: 'redis-cli ping'
                    }
                ],
                notes: [
                    'Reinicia el equipo después de activar WSL2 si Windows lo solicita.',
                    'También puedes usar Docker Desktop.'
                ]
            },
            {
                id: 'macos',
                label: 'macOS',
                recommended: false,
                steps: [
                    {
                        title: 'Instala Redis con Homebrew',
                        body: 'Instala el servidor desde la terminal.',
                        code: 'brew install redis'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Arranca Redis como servicio local.',
                        code: 'brew services start redis'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la conexión',
                        body: 'La terminal debe responder PONG.',
                        code: 'redis-cli ping'
                    }
                ],
                notes: ['También puedes usar Redis Cloud o Docker.']
            },
            {
                id: 'linux',
                label: 'Linux',
                recommended: false,
                steps: [
                    {
                        title: 'Instala Redis Server',
                        body: 'En Ubuntu o Debian instala el servidor desde los repositorios.',
                        code: 'sudo apt update && sudo apt install redis-server'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Activa Redis y comprueba que está funcionando.',
                        code: 'sudo systemctl enable --now redis-server'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la conexión',
                        body: 'La terminal debe responder PONG.',
                        code: 'redis-cli ping'
                    }
                ],
                notes: ['En Fedora o Arch Linux cambia apt por el gestor de paquetes correspondiente.']
            },
            {
                id: 'docker',
                label: 'Docker',
                recommended: false,
                steps: [
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia con persistencia para conservar los datos.',
                        code: 'docker run --name sql-academy-redis -p 6379:6379 -v sql-academy-redis-data:/data -d redis:8 redis-server --appendonly yes'
                    },
                    {
                        title: 'Revisa el arranque',
                        body: 'Comprueba que el contenedor sigue en ejecución.',
                        code: 'docker logs sql-academy-redis'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba la conexión',
                        body: 'Ejecuta redis-cli dentro del contenedor; debe responder PONG.',
                        code: 'docker exec -it sql-academy-redis redis-cli ping'
                    }
                ],
                notes: ['--appendonly yes activa la persistencia en el volumen.']
            }
        ],
        commonErrors: [
            {
                problem: 'Connection refused en localhost:6379',
                solution: 'Comprueba que el servicio o el contenedor estén iniciados.'
            },
            {
                problem: 'NOAUTH Authentication required',
                solution: 'La instancia tiene contraseña. Configura requirepass en el cliente o usa la contraseña definida.'
            },
            {
                problem: 'WSL2 no está disponible',
                solution: 'Actualiza Windows y ejecuta wsl --install como administrador.'
            },
            {
                problem: 'El puerto 6379 está ocupado',
                solution: 'Detén el otro servicio o cambia el puerto al arrancar Redis.'
            }
        ],
        security: [
            'Redis no usa autenticación por defecto; mantenlo en localhost mientras practicas.',
            'Si necesitas exponerlo, configura requirepass y una red privada.',
            'No publiques el puerto 6379 en internet.',
            'Revisa la persistencia y las copias si guardas datos importantes.'
        ],
        lastReviewed: '2026-11'
    },

    neo4j: {
        id: 'neo4j',
        name: 'Neo4j',
        logo: 'assets/logos/neo4j.png',
        type: 'NoSQL',
        difficulty: 'Media',
        time: '15-25 min',
        recommended: false,
        summary: 'Base de datos de grafos para modelar relaciones complejas con nodos y aristas.',
        officialUrl: 'https://neo4j.com/download/',
        docsUrl: 'https://neo4j.com/docs/',
        requirements: ['Cuenta gratuita para Aura', 'Opcional: Docker', 'Java si usas la distribución nativa'],
        clients: [
            { name: 'Neo4j Desktop', url: 'https://neo4j.com/download/' },
            { name: 'Neo4j Browser', url: 'https://neo4j.com/docs/browser-manual/current/' }
        ],
        cloudAlternative: {
            label: 'Neo4j AuraDB',
            url: 'https://neo4j.com/cloud/platform/aura-graph-database/',
            note: 'Instancia gratuita para practicar sin instalar nada.'
        },
        paths: [
            {
                id: 'windows',
                label: 'Windows (Desktop)',
                recommended: true,
                steps: [
                    {
                        title: 'Descarga Neo4j Desktop',
                        body: 'Descarga el instalador oficial para Windows.',
                        link: { label: 'Descargar Neo4j Desktop', url: 'https://neo4j.com/download/' }
                    },
                    {
                        title: 'Crea una base local',
                        body: 'Abre Neo4j Desktop, crea un proyecto y añade un DBMS local. Define una contraseña de práctica.'
                    },
                    {
                        title: 'Inicia la base',
                        body: 'Pulsa Start y abre Neo4j Browser cuando esté disponible.'
                    }
                ],
                verify: [
                    {
                        title: 'Ejecuta una consulta',
                        body: 'Conecta a bolt://localhost:7687 con el usuario neo4j y la contraseña definida. Ejecuta RETURN 1 AS ok;.'
                    }
                ],
                notes: ['Neo4j Desktop incluye Neo4j Browser y herramientas visuales.']
            },
            {
                id: 'macos',
                label: 'macOS (Desktop)',
                recommended: false,
                steps: [
                    {
                        title: 'Descarga Neo4j Desktop',
                        body: 'Descarga el archivo DMG desde la página oficial.',
                        link: { label: 'Descargar Neo4j Desktop', url: 'https://neo4j.com/download/' }
                    },
                    {
                        title: 'Crea una base local',
                        body: 'Abre Neo4j Desktop, crea un proyecto y añade un DBMS local. Define una contraseña de práctica.'
                    },
                    {
                        title: 'Inicia la base',
                        body: 'Pulsa Start y abre Neo4j Browser cuando esté disponible.'
                    }
                ],
                verify: [
                    {
                        title: 'Ejecuta una consulta',
                        body: 'Conecta a bolt://localhost:7687 con el usuario neo4j y la contraseña definida. Ejecuta RETURN 1 AS ok;.'
                    }
                ],
                notes: ['También existe una versión con Homebrew, pero Desktop es más sencilla para empezar.']
            },
            {
                id: 'docker',
                label: 'Linux / Docker',
                recommended: false,
                platforms: ['linux', 'docker'],
                steps: [
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia local con un volumen para conservar los datos.',
                        code: 'docker run --name sql-academy-neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/CambiaEstaClave123 -v sql-academy-neo4j-data:/data -d neo4j:5'
                    },
                    {
                        title: 'Espera el arranque',
                        body: 'Revisa los logs hasta que Neo4j esté listo.',
                        code: 'docker logs -f sql-academy-neo4j'
                    }
                ],
                verify: [
                    {
                        title: 'Abre Neo4j Browser',
                        body: 'Visita http://localhost:7474, conecta con bolt://localhost:7687 y ejecuta RETURN 1 AS ok;.'
                    }
                ],
                notes: [
                    'La contraseña debe tener al menos 8 caracteres.',
                    'En Linux también puedes instalar Neo4j de forma nativa siguiendo la documentación oficial.'
                ]
            }
        ],
        commonErrors: [
            {
                problem: 'Neo4j Browser no abre',
                solution: 'Comprueba que la base esté iniciada y que los puertos 7474 y 7687 estén libres.'
            },
            {
                problem: 'La contraseña es rechazada',
                solution: 'Usa al menos 8 caracteres y revisa el formato NEO4J_AUTH=usuario/contraseña.'
            },
            {
                problem: 'El contenedor se detiene',
                solution: 'Revisa los logs y asegúrate de que Docker tiene memoria suficiente.'
            }
        ],
        security: [
            'Cambia la contraseña de ejemplo antes de usar la base.',
            'No expongas los puertos 7474 y 7687 a internet.',
            'Usa AuraDB para experimentos que no quieras alojar en local.',
            'Haz copias de seguridad de las bases importantes.'
        ],
        lastReviewed: '2026-11'
    },

    cassandra: {
        id: 'cassandra',
        name: 'Cassandra',
        logo: 'assets/logos/cassandra.png',
        type: 'NoSQL',
        difficulty: 'Alta',
        time: '20-30 min',
        recommended: false,
        summary: 'Base de datos columnar distribuida para grandes volúmenes y alta disponibilidad.',
        officialUrl: 'https://cassandra.apache.org/_/download.html',
        docsUrl: 'https://cassandra.apache.org/doc/latest/',
        requirements: ['Docker Desktop en Windows', 'Al menos 2 GB de RAM para el contenedor', 'Opcional: Java para la instalación nativa'],
        clients: [
            { name: 'cqlsh (incluido)', url: 'https://cassandra.apache.org/doc/latest/cassandra/managing/tools/cqlsh.html' }
        ],
        cloudAlternative: {
            label: 'DataStax Astra DB',
            url: 'https://astra.datastax.com/',
            note: 'Plan gratuito para practicar sin instalar Cassandra.'
        },
        paths: [
            {
                id: 'windows',
                label: 'Windows (Docker)',
                recommended: true,
                steps: [
                    {
                        title: 'Instala Docker Desktop',
                        body: 'Cassandra no tiene instalador nativo para Windows. Usa Docker Desktop con WSL2.',
                        link: { label: 'Descargar Docker Desktop', url: 'https://www.docker.com/products/docker-desktop/' }
                    },
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia local con un volumen para conservar los datos.',
                        code: 'docker run --name sql-academy-cassandra -p 9042:9042 -v sql-academy-cassandra-data:/var/lib/cassandra -d cassandra:5'
                    },
                    {
                        title: 'Espera el arranque',
                        body: 'La primera inicialización puede tardar uno o dos minutos. Revisa los logs.',
                        code: 'docker logs -f sql-academy-cassandra'
                    }
                ],
                verify: [
                    {
                        title: 'Abre cqlsh',
                        body: 'Entra a la consola de Cassandra desde el contenedor.',
                        code: 'docker exec -it sql-academy-cassandra cqlsh'
                    },
                    {
                        title: 'Comprueba el clúster',
                        body: 'Dentro de cqlsh ejecuta DESCRIBE KEYSPACES; y comprueba que responde.'
                    }
                ],
                notes: ['Asigna al menos 2 GB de memoria a Docker Desktop.']
            },
            {
                id: 'macos',
                label: 'macOS (Homebrew)',
                recommended: false,
                steps: [
                    {
                        title: 'Instala Cassandra',
                        body: 'Homebrew instala Cassandra y una versión compatible de Java.',
                        code: 'brew install cassandra'
                    },
                    {
                        title: 'Inicia el servicio',
                        body: 'Arranca Cassandra como servicio local.',
                        code: 'brew services start cassandra'
                    },
                    {
                        title: 'Espera el arranque',
                        body: 'El primer arranque puede tardar. Revisa el estado del servicio si no responde.',
                        code: 'brew services info cassandra'
                    }
                ],
                verify: [
                    {
                        title: 'Abre cqlsh',
                        body: 'Conecta a la instancia local y ejecuta DESCRIBE KEYSPACES;.',
                        code: 'cqlsh'
                    }
                ],
                notes: ['También puedes usar Docker o DataStax Astra.']
            },
            {
                id: 'docker',
                label: 'Linux / Docker',
                recommended: false,
                platforms: ['linux', 'docker'],
                steps: [
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia local con un volumen para conservar los datos.',
                        code: 'docker run --name sql-academy-cassandra -p 9042:9042 -v sql-academy-cassandra-data:/var/lib/cassandra -d cassandra:5'
                    },
                    {
                        title: 'Espera el arranque',
                        body: 'Revisa los logs hasta que Cassandra acepte conexiones.',
                        code: 'docker logs -f sql-academy-cassandra'
                    }
                ],
                verify: [
                    {
                        title: 'Abre cqlsh',
                        body: 'Entra a la consola y comprueba el clúster.',
                        code: 'docker exec -it sql-academy-cassandra cqlsh'
                    }
                ],
                notes: ['En Linux también puedes instalar Cassandra con paquetes nativos siguiendo la documentación oficial.']
            }
        ],
        commonErrors: [
            {
                problem: 'El contenedor se detiene o reinicia',
                solution: 'Revisa la memoria disponible y los logs; Cassandra necesita al menos 2 GB para practicar con comodidad.'
            },
            {
                problem: 'cqlsh no puede conectar',
                solution: 'Espera a que termine la inicialización y comprueba que el puerto 9042 está libre.'
            },
            {
                problem: 'Java no está instalado',
                solution: 'Instala Java 17 si usas la distribución nativa; Docker no necesita Java en el equipo.'
            },
            {
                problem: 'El puerto 9042 está ocupado',
                solution: 'Detén el otro servicio o cambia el puerto publicado del contenedor.'
            }
        ],
        security: [
            'Cassandra no usa autenticación por defecto; no la expongas a internet.',
            'Para un entorno compartido, configura autenticación y TLS siguiendo la documentación oficial.',
            'Mantén la instancia de práctica en localhost.',
            'Haz copias de seguridad antes de cambiar datos importantes.'
        ],
        lastReviewed: '2026-11'
    },

    elasticsearch: {
        id: 'elasticsearch',
        name: 'Elasticsearch',
        logo: 'assets/logos/elasticsearch.png',
        type: 'NoSQL',
        difficulty: 'Alta',
        time: '20-30 min',
        recommended: false,
        summary: 'Motor de búsqueda y análisis distribuido para texto completo, logs y agregaciones.',
        officialUrl: 'https://www.elastic.co/downloads/elasticsearch',
        docsUrl: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html',
        requirements: ['Al menos 2 GB de memoria libre', 'Java incluido en la distribución', 'Opcional: Docker'],
        clients: [
            { name: 'Kibana', url: 'https://www.elastic.co/downloads/kibana' }
        ],
        cloudAlternative: {
            label: 'Elastic Cloud',
            url: 'https://cloud.elastic.co/registration',
            note: 'Prueba gratuita de Elastic Cloud; revisa la duración y las condiciones antes de usarla.'
        },
        paths: [
            {
                id: 'windows',
                label: 'Windows (ZIP)',
                recommended: false,
                steps: [
                    {
                        title: 'Descarga Elasticsearch',
                        body: 'Descarga el archivo ZIP para Windows desde la página oficial.',
                        link: { label: 'Descargar Elasticsearch', url: 'https://www.elastic.co/downloads/elasticsearch' }
                    },
                    {
                        title: 'Extrae el archivo',
                        body: 'Descomprime el ZIP en una carpeta sin espacios en la ruta.'
                    },
                    {
                        title: 'Arranca Elasticsearch',
                        body: 'Abre PowerShell en la carpeta y ejecuta el arranque.',
                        code: '.\\bin\\elasticsearch.bat'
                    },
                    {
                        title: 'Guarda la contraseña inicial',
                        body: 'En el primer arranque se genera la contraseña del usuario elastic y se muestra en la consola. Guárdala.'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba el servicio',
                        body: 'Abre https://localhost:9200, acepta el certificado local y usa el usuario elastic y la contraseña generada.'
                    },
                    {
                        title: 'Instala Kibana opcionalmente',
                        body: 'Kibana ofrece una interfaz visual y Dev Tools para ejecutar consultas.',
                        link: { label: 'Descargar Kibana', url: 'https://www.elastic.co/downloads/kibana' }
                    }
                ],
                notes: ['Si pierdes la contraseña, ejecuta bin\\elasticsearch-reset-password -u elastic.']
            },
            {
                id: 'macos',
                label: 'macOS (tar.gz)',
                recommended: false,
                steps: [
                    {
                        title: 'Descarga Elasticsearch',
                        body: 'Descarga el archivo tar.gz desde la página oficial.',
                        link: { label: 'Descargar Elasticsearch', url: 'https://www.elastic.co/downloads/elasticsearch' }
                    },
                    {
                        title: 'Extrae el archivo',
                        body: 'Descomprime el archivo en una carpeta de trabajo.',
                        code: 'tar -xzf elasticsearch-*.tar.gz && cd elasticsearch-*'
                    },
                    {
                        title: 'Arranca Elasticsearch',
                        body: 'Inicia el servidor desde la carpeta extraída.',
                        code: './bin/elasticsearch'
                    },
                    {
                        title: 'Guarda la contraseña inicial',
                        body: 'La primera ejecución muestra la contraseña del usuario elastic y el certificado local.'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba el servicio',
                        body: 'Usa el certificado generado y la contraseña inicial.',
                        code: 'curl --cacert config/certs/http_ca.crt -u elastic https://localhost:9200'
                    }
                ],
                notes: ['También puedes usar Docker para evitar instalar Java.']
            },
            {
                id: 'linux',
                label: 'Linux (tar.gz)',
                recommended: false,
                steps: [
                    {
                        title: 'Descarga Elasticsearch',
                        body: 'Descarga el archivo tar.gz desde la página oficial.',
                        link: { label: 'Descargar Elasticsearch', url: 'https://www.elastic.co/downloads/elasticsearch' }
                    },
                    {
                        title: 'Ajusta la memoria virtual',
                        body: 'Elasticsearch necesita este ajuste en Linux. Para conservarlo tras reiniciar, añade vm.max_map_count=262144 a /etc/sysctl.conf.',
                        code: 'sudo sysctl -w vm.max_map_count=262144'
                    },
                    {
                        title: 'Extrae y arranca',
                        body: 'Descomprime el archivo y ejecuta el servidor.',
                        code: 'tar -xzf elasticsearch-*.tar.gz && cd elasticsearch-* && ./bin/elasticsearch'
                    },
                    {
                        title: 'Guarda la contraseña inicial',
                        body: 'La primera ejecución muestra la contraseña del usuario elastic y el certificado local.'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba el servicio',
                        body: 'Usa el certificado generado y la contraseña inicial.',
                        code: 'curl --cacert config/certs/http_ca.crt -u elastic https://localhost:9200'
                    }
                ],
                notes: [
                    'No ejecutes Elasticsearch como root.',
                    'La distribución incluye su propia JVM.'
                ]
            },
            {
                id: 'docker',
                label: 'Docker',
                recommended: true,
                steps: [
                    {
                        title: 'Arranca el contenedor',
                        body: 'Crea una instancia local con seguridad activada y un volumen para los datos.',
                        code: 'docker run --name sql-academy-elasticsearch -e discovery.type=single-node -e ELASTIC_PASSWORD=CambiaEstaClave123 -p 9200:9200 -v sql-academy-es-data:/usr/share/elasticsearch/data -d docker.elastic.co/elasticsearch/elasticsearch:9.5.6'
                    },
                    {
                        title: 'Espera el arranque',
                        body: 'Revisa los logs hasta que el servicio esté listo.',
                        code: 'docker logs -f sql-academy-elasticsearch'
                    }
                ],
                verify: [
                    {
                        title: 'Comprueba el servicio',
                        body: 'La respuesta debe incluir el nombre del clúster y la versión.',
                        code: 'curl -k -u elastic:CambiaEstaClave123 https://localhost:9200'
                    }
                ],
                notes: [
                    'La imagen necesita al menos 2 GB de memoria libre.',
                    'Cambia la contraseña de ejemplo antes de usar el entorno en red.'
                ]
            }
        ],
        commonErrors: [
            {
                problem: 'max virtual memory areas vm.max_map_count is too low',
                solution: 'Ejecuta sudo sysctl -w vm.max_map_count=262144 en Linux.'
            },
            {
                problem: 'El puerto 9200 está ocupado',
                solution: 'Detén el otro servicio o publica el contenedor en otro puerto.'
            },
            {
                problem: 'El contenedor se detiene por falta de memoria',
                solution: 'Libera memoria o aumenta el límite de Docker a al menos 2 GB.'
            },
            {
                problem: 'El navegador advierte del certificado',
                solution: 'Es el certificado local de Elasticsearch. Acepta la excepción solo en tu equipo de práctica.'
            },
            {
                problem: 'No recuerdo la contraseña de elastic',
                solution: 'Usa bin/elasticsearch-reset-password -u elastic desde la instalación local o el contenedor.'
            }
        ],
        security: [
            'Mantén la seguridad activada; no desactives TLS en redes compartidas.',
            'Cambia la contraseña de ejemplo antes de usar la instancia.',
            'Mantén Elasticsearch en localhost mientras practicas.',
            'Revisa las condiciones de licencia de Elastic antes de usarlo en producción.'
        ],
        lastReviewed: '2026-11'
    },

    firebase: {
        id: 'firebase',
        name: 'Firebase',
        logo: 'assets/logos/firebase.png',
        type: 'NoSQL',
        difficulty: 'Fácil',
        time: '10-15 min',
        recommended: true,
        summary: 'Plataforma en la nube de Google; Firestore guarda documentos y sincroniza datos en tiempo real.',
        officialUrl: 'https://firebase.google.com/docs/firestore',
        docsUrl: 'https://firebase.google.com/docs',
        requirements: ['Cuenta de Google', 'Node.js y Java para el emulador local'],
        clients: [
            { name: 'Consola de Firebase', url: 'https://console.firebase.google.com/' },
            { name: 'Firebase CLI', url: 'https://firebase.google.com/docs/cli' }
        ],
        cloudAlternative: null,
        paths: [
            {
                id: 'web',
                label: 'Consola web',
                recommended: true,
                platforms: ['windows', 'macos', 'linux'],
                steps: [
                    {
                        title: 'Crea un proyecto',
                        body: 'Entra en la consola, pulsa Crear proyecto y elige un nombre. No necesitas instalar nada.'
                    },
                    {
                        title: 'Activa Firestore',
                        body: 'En el menú lateral abre Firestore Database, crea una base en modo nativo y elige una ubicación.'
                    },
                    {
                        title: 'Crea una colección de prueba',
                        body: 'Añade una colección estudiantes y un documento con nombre y nivel.'
                    }
                ],
                verify: [
                    {
                        title: 'Lee el documento',
                        body: 'Abre el documento en Firestore y comprueba que los campos se guardaron.'
                    },
                    {
                        title: 'Revisa las reglas',
                        body: 'En la pestaña Reglas, confirma que no vas a dejar las reglas de prueba abiertas para siempre.'
                    }
                ],
                notes: [
                    'Firestore tiene una capa gratuita para practicar; revisa los límites antes de crear datos masivos.',
                    'La consola funciona en cualquier sistema operativo.'
                ]
            },
            {
                id: 'emulator',
                label: 'Emulador local',
                recommended: false,
                platforms: ['windows', 'macos', 'linux'],
                steps: [
                    {
                        title: 'Instala Node.js y Java',
                        body: 'Instala Node.js LTS y Java 11 o superior. El emulador de Firestore necesita ambos.'
                    },
                    {
                        title: 'Instala Firebase CLI',
                        body: 'Instala la herramienta oficial desde npm.',
                        code: 'npm install -g firebase-tools'
                    },
                    {
                        title: 'Inicia sesión',
                        body: 'Conecta la CLI con tu cuenta de Google.',
                        code: 'firebase login'
                    },
                    {
                        title: 'Inicializa el proyecto',
                        body: 'Ejecuta el asistente en una carpeta de práctica y selecciona Firestore. Puedes elegir no configurar un proyecto predeterminado si solo quieres usar el emulador.',
                        code: 'firebase init'
                    },
                    {
                        title: 'Configura los emuladores',
                        body: 'Elige Firestore cuando el asistente pregunte qué emuladores configurar.',
                        code: 'firebase init emulators'
                    },
                    {
                        title: 'Arranca el emulador',
                        body: 'Ejecuta el emulador de Firestore desde la carpeta del proyecto.',
                        code: 'firebase emulators:start --only firestore'
                    }
                ],
                verify: [
                    {
                        title: 'Abre la interfaz del emulador',
                        body: 'Visita http://localhost:4000 y comprueba que Firestore aparece en la lista.'
                    },
                    {
                        title: 'Crea un documento de prueba',
                        body: 'Usa la pestaña Firestore del emulador para crear una colección y un documento.'
                    }
                ],
                notes: [
                    'El emulador guarda los datos localmente y no necesita una cuenta de Firebase para las pruebas.',
                    'Si el puerto 4000 está ocupado, cambia la configuración en firebase.json.'
                ]
            }
        ],
        commonErrors: [
            {
                problem: 'El emulador pide Java',
                solution: 'Instala Java 11 o superior y vuelve a ejecutar firebase emulators:start.'
            },
            {
                problem: 'No puedo iniciar sesión en Firebase CLI',
                solution: 'Ejecuta firebase login --reauth y completa el inicio de sesión en el navegador.'
            },
            {
                problem: 'El puerto 4000 está ocupado',
                solution: 'Cambia el puerto de la interfaz del emulador en firebase.json.'
            },
            {
                problem: 'Firestore no aparece en la consola',
                solution: 'Comprueba que el proyecto correcto está seleccionado y que Firestore está activado.'
            }
        ],
        security: [
            'No dejes las reglas de prueba abiertas en un proyecto real.',
            'No publiques claves de servicio ni archivos de configuración privados.',
            'Configura reglas de Firestore antes de guardar datos reales.',
            'Revisa la cuota y las condiciones del plan gratuito.'
        ],
        lastReviewed: '2026-11'
    }
};
