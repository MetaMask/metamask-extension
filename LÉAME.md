LÉAME.md
Extensión del navegador MetaMask
Puede encontrar la última versión de MetaMask en nuestro sitio web oficial . Para obtener ayuda con el uso de MetaMask, visite nuestro sitio de soporte al usuario .

Para preguntas generales , solicitudes de funciones o preguntas de desarrolladores , visite nuestro foro de la comunidad .

MetaMask es compatible con los navegadores basados ​​en Firefox, Google Chrome y Chromium. Recomendamos utilizar la última versión disponible del navegador.

Para noticias de última hora, siga nuestras páginas de Twitter o Medium .

Para obtener información sobre cómo desarrollar aplicaciones compatibles con MetaMask, visite nuestra Documentación para desarrolladores .

Para obtener información sobre cómo contribuir al proyecto MetaMask, visite nuestros Documentos internos .

Construyendo localmente
Instalar Node.js versión 16
Si está utilizando nvm (recomendado), la ejecución nvm useelegirá automáticamente la versión de nodo adecuada para usted.
Instalar hilo v3
SOLO siga los pasos en las secciones "Instalar Corepack" y "Actualización de la versión global de Yarn"
NO realice ninguno de los pasos de las secciones "Inicializar su proyecto", "Actualizar a las últimas versiones" o "Instalar la última compilación nueva desde la maestra". Estos pasos podrían resultar en que su repositorio se reinicie o instale la versión incorrecta de yarn, lo que puede romper su compilación.
Copie el .metamaskrc.distarchivo a.metamaskrc
Reemplace el INFURA_PROJECT_IDvalor con su propio ID de proyecto Infura personal .
Si está depurando MetaMetrics, deberá agregar un valor para SEGMENT_WRITE_KEY la clave de escritura de segmento , consulte Desarrollo en MetaMask - Segmento .
Si depura excepciones no controladas, deberá agregar un valor para SENTRY_DSN Sentry Dsn , consulte Desarrollo en MetaMask - Sentry .
Opcionalmente, reemplace el PASSWORDvalor con la contraseña de su billetera de desarrollo para evitar ingresarla cada vez que abra la aplicación.
Cree el proyecto en la ./dist/carpeta con yarn dist.
Opcionalmente, puede ejecutar yarn startpara ejecutar el modo de desarrollo.
Las compilaciones sin comprimir se pueden encontrar en /dist, las compilaciones comprimidas se pueden encontrar /buildsuna vez que se compilan.

Consulte el archivo Léame del sistema de compilación para obtener información sobre el uso del sistema de compilación.

Ganchos Git
Para obtener comentarios rápidos de nuestras funciones de aptitud de calidad de código compartido antes de enviar el código, puede instalar nuestros git hooks con Husky.

$ yarn githooks:install

Puede leer más sobre ellos en nuestra documentación de prueba .

contribuyendo
Construcciones de desarrollo
Para iniciar una compilación de desarrollo (por ejemplo, con registro y visualización de archivos), ejecute yarn start.

React y Redux DevTools
Para iniciar React DevTools , ejecútelo yarn devtools:reactcon una compilación de desarrollo instalada en un navegador. Esto se abrirá en una ventana separada; no se requiere extensión del navegador.

Para iniciar la extensión Redux DevTools :

Instale el paquete remotedev-serverglobalmente (p. ej. yarn global add remotedev-server)
Instale la extensión Redux Devtools.
Abra la extensión Redux DevTools y marque la casilla de verificación "Usar servidor personalizado (local)" en la configuración de Remote DevTools, usando la configuración de servidor predeterminada (host localhost, puerto 8000, casilla de verificación de conexión segura sin marcar).
Luego ejecute el comando yarn devtools:reduxcon una compilación de desarrollo instalada en un navegador. Esto le permitirá usar la extensión Redux DevTools para inspeccionar MetaMask.

Para crear una compilación de desarrollo y ejecutar ambas herramientas simultáneamente, ejecute yarn start:dev.

prueba dapp
Este sitio de prueba se puede utilizar para ejecutar diferentes flujos de usuario.

Ejecución de pruebas unitarias y Linting
Ejecute pruebas unitarias y el linter con yarn test. Para ejecutar solo pruebas unitarias, ejecute yarn test:unit.

Puede ejecutar el linter solo con yarn lint, y puede solucionar automáticamente algunos problemas de pelusa con yarn lint:fix. También puede ejecutar estos dos comandos solo en sus cambios locales para ahorrar tiempo con yarn lint:changedy yarn lint:changed:fixrespectivamente.

Para obtener una guía de depuración de Jest con Node.js, consulte docs/tests/jest.md .

Ejecución de pruebas E2E
Nuestro conjunto de pruebas e2e se puede ejecutar en Firefox o Chrome.

necesarios yarn build:test para crear una compilación de prueba.
ejecutar pruebas, apuntando al navegador:
Las pruebas de Firefox e2e se pueden ejecutar con yarn test:e2e:firefox.
Las pruebas de Chrome e2e se pueden ejecutar con yarn test:e2e:chrome. La chromedriverversión principal del paquete debe coincidir con la versión principal de su instalación local de Chrome. Si no coinciden, actualice el que esté detrás antes de ejecutar las pruebas de Chrome e2e.
Todos estos scripts de prueba admiten opciones adicionales, que pueden ser útiles para la depuración. Ejecute el script con la bandera --helppara ver todas las opciones.

Ejecutar una sola prueba e2e
Las pruebas e2e individuales se pueden ejecutar yarn test:e2e:single test/e2e/tests/TEST_NAME.spec.jsjunto con las opciones a continuación.

  --browser        Set the browser used; either 'chrome' or 'firefox'.
                                         [string] [choices: "chrome", "firefox"]
  --debug          Run tests in debug mode, logging each driver interaction
                                                      [boolean] [default: false]
  --retries        Set how many times the test should be retried upon failure.
                                                           [number] [default: 0]
  --leave-running  Leaves the browser running after a test fails, along with
                   anything else that the test used (ganache, the test dapp,
                   etc.)                              [boolean] [default: false]
Por ejemplo, para ejecutar las account-detailspruebas con Chrome, con el registro de depuración y con el navegador configurado para permanecer abierto en caso de falla, usaría: yarn test:e2e:single test/e2e/tests/account-details.spec.js --browser=chrome --debug --leave-running

Cambio de dependencias
Siempre que cambie las dependencias (agregando, eliminando o actualizando, ya sea en package.jsono en yarn.lock), hay varios archivos que deben mantenerse actualizados.

yarn.lock:
Vuelva a ejecutarlo yarndespués de los cambios para asegurarse de yarn.lockque se haya actualizado correctamente.
Ejecutar yarn lint:lockfile:dedupe:fixpara eliminar las dependencias duplicadas del archivo de bloqueo.
La allow-scriptsconfiguración enpackage.json
Ejecutar yarn allow-scripts autopara actualizar la allow-scriptsconfiguración automáticamente. Esta configuración determina si los scripts de instalación/posinstalación del paquete pueden ejecutarse. Revise cada paquete nuevo para determinar si el script de instalación debe ejecutarse o no, y realice pruebas si es necesario.
Desafortunadamente, yarn allow-scripts autose comportará de manera inconsistente en diferentes plataformas. Los usuarios de macOS y Windows pueden ver cambios extraños relacionados con las dependencias opcionales.
Los archivos de políticas de LavaMoat. El tl; dr debe ejecutarse yarn lavamoat:autopara actualizar estos archivos, pero puede haber problemas en los detalles:
Hay dos conjuntos de archivos de política de LavaMoat:
Los archivos de políticas LavaMoat de producción ( lavamoat/browserify/*/policy.json), que se vuelven a generar utilizando yarn lavamoat:background:auto. Añadir --helppara el uso.
Estos deben regenerarse siempre que cambien las dependencias de producción para el fondo.
El archivo de política LavaMoat del sistema de compilación ( lavamoat/build-system/policy.json), que se vuelve a generar mediante yarn lavamoat:build:auto.
Esto debe regenerarse siempre que cambien las dependencias utilizadas por el propio sistema de compilación.
Cada vez que regenere un archivo de políticas, revise los cambios para determinar si el acceso otorgado a cada paquete parece apropiado.
Desafortunadamente, yarn lavamoat:autose comportará de manera inconsistente en diferentes plataformas. Los usuarios de macOS y Windows pueden ver cambios extraños relacionados con las dependencias opcionales.
Si sigue teniendo fallas en las políticas incluso después de regenerar los archivos de políticas, intente regenerar las políticas después de una instalación limpia haciendo lo siguiente:
rm -rf node_modules/ && yarn && yarn lavamoat:auto
Tenga en cuenta que cualquier tipo de importación dinámica o uso dinámico de globales puede eludir el análisis estático de LavaMoat. Consulte la documentación de LavaMoat o solicite ayuda si tiene algún problema.
Arquitectura
Visual de la jerarquía y las dependencias del controlador a partir del verano de 2022.
Visual de todo el código base.
Diagrama de arquitectura

Otros documentos
Cómo agregar una compilación personalizada a Chrome
Cómo agregar una compilación personalizada a Firefox
Cómo agregar una nueva traducción a MetaMask
Guía de publicación
Cómo usar el emulador TREZOR
Desarrollando en MetaMask
Cómo generar una visualización del desarrollo de este repositorio
Cómo agregar nuevas confirmaciones
Recursos para desarrolladores de Dapp
Amplíe las funciones de MetaMask con MetaMask Snaps.
Pida a sus usuarios que agreguen y cambien a una nueva red.
Cambie el logotipo que aparece cuando su dapp se conecta a MetaMask.
