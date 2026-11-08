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
    }
};
