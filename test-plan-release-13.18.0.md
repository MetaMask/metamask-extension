# Plan de Pruebas - Release 13.18.0

Este documento contiene el plan de pruebas completo para la release 13.18.0 de MetaMask Extension, basado en los cambios documentados en el CHANGELOG.

## Índice

1. [Funcionalidades Nuevas (Added)](#funcionalidades-nuevas-added)
2. [Cambios (Changed)](#cambios-changed)
3. [Correcciones (Fixed)](#correcciones-fixed)
4. [Pruebas de Regresión](#pruebas-de-regresión)

---

## Funcionalidades Nuevas (Added)

### TEST-001: Sanitized Origin en Sentinel Metadata

**Prioridad:** Media  
**Tipo:** Funcional  
**Área:** Seguridad / Metadata

**Descripción:** Verificar que el origen sanitizado se añade correctamente a los metadatos del sentinel.

**Por qué se prueba:** Este cambio mejora la seguridad y trazabilidad de los metadatos enviados. Es importante verificar que los orígenes se sanitizan correctamente para evitar fugas de información sensible.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Conectar a un dapp externo
3. Realizar una transacción desde el dapp
4. Verificar en los logs/metadatos que el origen está sanitizado (sin información sensible)
5. Verificar que el origen sanitizado se incluye en los metadatos del sentinel

**Resultado esperado:** El origen aparece sanitizado en los metadatos, sin exponer información sensible del usuario.

**Archivos relacionados:** `app/scripts/controllers/sentinel-controller.ts`

---

### TEST-002: Ledger Connectivity con WebHID Transport

**Prioridad:** Alta  
**Tipo:** Funcional / Hardware  
**Área:** Hardware Wallets

**Descripción:** Verificar que Ledger se conecta correctamente usando WebHID transport directo en lugar del iframe bridge.

**Por qué se prueba:** Este es un cambio crítico que mejora la conectividad de Ledger. El cambio de iframe bridge a WebHID directo puede afectar la experiencia del usuario y la compatibilidad del navegador.

**Pasos de prueba:**
1. Tener un dispositivo Ledger físico conectado
2. Abrir MetaMask y desbloquear la wallet
3. Ir al menú de cuentas y seleccionar "Connect Hardware Wallet"
4. Seleccionar "Ledger"
5. Verificar que la conexión se establece usando WebHID (no iframe)
6. Verificar que se pueden derivar cuentas correctamente
7. Realizar una transacción de prueba con la cuenta de Ledger
8. Verificar que la firma funciona correctamente

**Resultado esperado:** Ledger se conecta exitosamente usando WebHID, se pueden derivar cuentas y firmar transacciones sin problemas.

**Archivos relacionados:** `app/scripts/lib/ledger-connect.ts`, `test/e2e/tests/hardware-wallets/ledger/`

**Notas:** 
- Probar en Chrome/Chromium (WebHID no está disponible en Firefox)
- Verificar que no hay errores en la consola relacionados con iframe bridge

---

### TEST-003: Shield Notification en App Navigation

**Prioridad:** Media  
**Tipo:** UI/UX  
**Área:** Shield / Navigation

**Descripción:** Verificar que la notificación de Shield aparece correctamente en la navegación de la app.

**Por qué se prueba:** Las notificaciones en la navegación son importantes para la visibilidad de las funcionalidades. Necesitamos verificar que se muestra correctamente y no interfiere con otros elementos de navegación.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar a la página principal (Home)
3. Verificar que la notificación de Shield aparece en la navegación
4. Verificar que la notificación es clickeable
5. Hacer clic en la notificación y verificar que navega a la página de Shield
6. Verificar que la notificación desaparece cuando corresponde (si aplica)
7. Verificar que no interfiere con otros elementos de navegación

**Resultado esperado:** La notificación de Shield aparece correctamente en la navegación, es funcional y no interfiere con otros elementos.

**Archivos relacionados:** `ui/components/app/shield-notification/`, `test/e2e/tests/shield/`

---

### TEST-004: Botón "Disconnect All" en Dapp Connections

**Prioridad:** Alta  
**Tipo:** Funcional / UI  
**Área:** Permissions / Connections

**Descripción:** Verificar que el botón "Disconnect All" funciona correctamente en la pantalla principal de conexiones de dapps.

**Por qué se prueba:** Esta es una nueva funcionalidad que mejora la UX para desconectar múltiples dapps. Es importante verificar que desconecta todas las conexiones correctamente y actualiza el estado.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Conectar la wallet a múltiples dapps (al menos 2-3)
3. Ir a la página de conexiones (Settings > Connected Sites o desde el navbar)
4. Verificar que el botón "Disconnect All" está visible en la pantalla principal
5. Hacer clic en "Disconnect All"
6. Verificar que aparece un modal de confirmación
7. Confirmar la desconexión
8. Verificar que todas las conexiones se han desconectado
9. Verificar que los dapps ya no tienen acceso a la wallet
10. Verificar que el estado se actualiza correctamente en la UI

**Resultado esperado:** El botón "Disconnect All" aparece, desconecta todas las conexiones correctamente y actualiza el estado de la UI.

**Archivos relacionados:** `ui/pages/permissions/permission-list-page/`, `test/e2e/tests/connections/`

**Notas:** Comparar con el comportamiento anterior donde solo se podía desconectar individualmente.

---

### TEST-005: Static Assets Polling Controller

**Prioridad:** Baja  
**Tipo:** Funcional / Backend  
**Área:** Assets / State Management

**Descripción:** Verificar que el nuevo controlador de polling de assets estáticos funciona correctamente.

**Por qué se prueba:** Este controlador gestiona el polling de assets estáticos. Aunque es un cambio interno, debemos verificar que no rompe la funcionalidad existente y que los assets se actualizan correctamente.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Verificar que los assets se cargan correctamente
3. Esperar un período de tiempo (verificar intervalo de polling)
4. Verificar que los assets se actualizan automáticamente
5. Verificar en los logs que el polling controller está activo
6. Verificar que no hay errores relacionados con el polling

**Resultado esperado:** Los assets estáticos se actualizan correctamente mediante el polling controller sin errores.

**Archivos relacionados:** `app/scripts/controllers/static-assets-polling-controller.ts`

**Notas:** Este es principalmente un cambio interno, puede requerir verificación de logs o estado interno.

---

### TEST-006: Warning Message para Gas Sponsorship No Disponible

**Prioridad:** Media  
**Tipo:** UI/UX / Funcional  
**Área:** Gas / Smart Transactions

**Descripción:** Verificar que aparece un mensaje de advertencia cuando el gas sponsorship no está disponible debido a requisitos de balance de reserva.

**Por qué se prueba:** Este mensaje ayuda a los usuarios a entender por qué no pueden usar gas sponsorship. Es importante que el mensaje sea claro y aparezca en el momento correcto.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Configurar una cuenta con balance insuficiente para gas sponsorship (por debajo del requisito de reserva)
3. Intentar realizar una transacción que requiera gas sponsorship
4. Verificar que aparece el mensaje de advertencia
5. Verificar que el mensaje es claro y explica el problema
6. Verificar que el mensaje aparece en el lugar correcto de la UI
7. Probar con diferentes escenarios de balance (justo por debajo, muy por debajo)

**Resultado esperado:** El mensaje de advertencia aparece correctamente cuando el balance es insuficiente para gas sponsorship, con un mensaje claro y útil.

**Archivos relacionados:** `ui/components/app/gas-sponsorship-warning/`

---

### TEST-007: Transaction History UI para Perps

**Prioridad:** Media  
**Tipo:** UI/UX / Funcional  
**Área:** Perps / Trading

**Descripción:** Verificar que la UI de historial de transacciones para perps se muestra correctamente.

**Por qué se prueba:** Esta es una nueva funcionalidad de UI para mostrar el historial de transacciones de perps. Necesitamos verificar que se muestra correctamente y que los datos son precisos.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar a la sección de Perps (si está disponible)
3. Realizar algunas transacciones de perps (si es posible en test)
4. Verificar que el historial de transacciones se muestra
5. Verificar que las transacciones se listan correctamente
6. Verificar que los detalles de cada transacción son correctos
7. Verificar que el historial se actualiza después de nuevas transacciones
8. Verificar la paginación si hay muchas transacciones

**Resultado esperado:** La UI de historial de transacciones para perps se muestra correctamente con todos los detalles relevantes.

**Archivos relacionados:** `ui/pages/perps/transaction-history/`, `test/e2e/tests/perps/`

**Notas:** Puede requerir feature flags o configuración especial para acceder a perps.

---

### TEST-008: Static Perps Order Entry (Feature Flag)

**Prioridad:** Baja  
**Tipo:** Funcional / Feature Flag  
**Área:** Perps / Trading

**Descripción:** Verificar que la entrada de órdenes estáticas de perps funciona correctamente cuando el feature flag está habilitado.

**Por qué se prueba:** Esta funcionalidad está detrás de un feature flag, por lo que debemos verificar que funciona cuando está habilitada y que no afecta cuando está deshabilitada.

**Pasos de prueba:**
1. Habilitar el feature flag para perps order entry
2. Abrir MetaMask y desbloquear la wallet
3. Navegar a la sección de Perps
4. Verificar que la entrada de órdenes estáticas está disponible
5. Crear una orden estática de prueba
6. Verificar que la orden se crea correctamente
7. Verificar que la orden aparece en el historial
8. Deshabilitar el feature flag y verificar que la funcionalidad no está disponible

**Resultado esperado:** La entrada de órdenes estáticas funciona correctamente cuando el feature flag está habilitado y no aparece cuando está deshabilitado.

**Archivos relacionados:** `ui/pages/perps/order-entry/`

**Notas:** Requiere configuración de feature flags en `.metamaskrc` o `.manifest-overrides.json`.

---

### TEST-009: Points Estimate History Tracking

**Prioridad:** Baja  
**Tipo:** Funcional / Backend  
**Área:** Metrics / Customer Support

**Descripción:** Verificar que el historial de estimación de puntos se rastrea correctamente en los state logs para diagnóstico de Customer Support.

**Por qué se prueba:** Este cambio es para diagnóstico interno y soporte. Debemos verificar que los datos se rastrean correctamente sin afectar el rendimiento.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Realizar acciones que generen estimaciones de puntos (rewards, etc.)
3. Verificar en los state logs que el historial de estimaciones se está rastreando
4. Verificar que los datos están en el formato correcto
5. Verificar que no hay impacto en el rendimiento

**Resultado esperado:** El historial de estimación de puntos se rastrea correctamente en los state logs para diagnóstico.

**Archivos relacionados:** `app/scripts/controllers/rewards-controller.ts`

**Notas:** Este es principalmente un cambio interno para soporte, puede requerir verificación de logs internos.

---

### TEST-010: Reset Shield Default Payment Method

**Prioridad:** Media  
**Tipo:** Funcional  
**Área:** Shield / Payments

**Descripción:** Verificar que el método de pago por defecto de Shield se restablece al más adecuado (crypto) si está disponible después de cancelar el flujo de pago.

**Por qué se prueba:** Este cambio mejora la UX al restablecer automáticamente el método de pago más adecuado después de cancelar. Es importante verificar que funciona correctamente en diferentes escenarios.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar a Shield settings
3. Configurar un método de pago (por ejemplo, tarjeta de crédito)
4. Iniciar un flujo de pago
5. Cancelar el flujo de pago (cerrar el modal, cancelar en Stripe, etc.)
6. Verificar que el método de pago por defecto se restablece a crypto (si está disponible)
7. Verificar que el método de pago se actualiza correctamente en la UI
8. Probar con diferentes métodos de pago iniciales

**Resultado esperado:** Después de cancelar el flujo de pago, el método de pago por defecto se restablece automáticamente al más adecuado (crypto si está disponible).

**Archivos relacionados:** `app/scripts/controllers/shield-controller.ts`, `test/e2e/tests/shield/`

---

### TEST-011: Cache Bridge getToken Responses

**Prioridad:** Media  
**Tipo:** Performance / Funcional  
**Área:** Bridge / Tokens

**Descripción:** Verificar que las respuestas de `getToken` del bridge se cachean correctamente para mejorar el rendimiento.

**Por qué se prueba:** El caching puede mejorar significativamente el rendimiento, pero debemos verificar que los datos cacheados son correctos y se invalidan cuando es necesario.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar a la funcionalidad de Bridge
3. Buscar un token en el bridge
4. Verificar que la primera llamada obtiene los datos del servidor
5. Buscar el mismo token nuevamente
6. Verificar que la segunda llamada usa el cache (más rápida)
7. Verificar que los datos cacheados son correctos
8. Verificar que el cache se invalida después de un tiempo apropiado
9. Verificar que no hay errores relacionados con el cache

**Resultado esperado:** Las respuestas de `getToken` se cachean correctamente, mejorando el rendimiento sin afectar la precisión de los datos.

**Archivos relacionados:** `app/scripts/lib/bridge-cache.ts`

**Notas:** Puede requerir verificación de network requests en DevTools para confirmar el caching.

---

### TEST-012: Deeplinking al NFT Tab

**Prioridad:** Media  
**Tipo:** Funcional / Navigation  
**Área:** NFTs / Deep Links

**Descripción:** Verificar que los deep links navegan correctamente al tab de NFTs.

**Por qué se prueba:** Los deep links mejoran la UX permitiendo navegación directa. Necesitamos verificar que funcionan correctamente y que el tab de NFTs se abre como se espera.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Crear un deep link que apunte al tab de NFTs
3. Abrir el deep link (desde un dapp externo o directamente)
4. Verificar que MetaMask se abre
5. Verificar que navega directamente al tab de NFTs
6. Verificar que el tab de NFTs está activo y visible
7. Verificar que los NFTs se cargan correctamente
8. Probar con diferentes formatos de deep link

**Resultado esperado:** Los deep links navegan correctamente al tab de NFTs y la UI se muestra como se espera.

**Archivos relacionados:** `ui/pages/nfts/`, `test/e2e/tests/deep-link/`

**Notas:** Verificar el formato de deep link en `test/e2e/tests/deep-link/helpers.ts`.

---

### TEST-013: Tempo Testnet Native y Network Token IDs e Imágenes

**Prioridad:** Baja  
**Tipo:** Funcional / UI  
**Área:** Networks / Tokens

**Descripción:** Verificar que Tempo testnet tiene los IDs e imágenes correctos para tokens nativos y de red.

**Por qué se prueba:** Este cambio añade soporte para Tempo testnet. Necesitamos verificar que los tokens se muestran correctamente con sus IDs e imágenes.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Añadir Tempo testnet a la lista de redes
3. Cambiar a Tempo testnet
4. Verificar que el token nativo (Tempo) se muestra correctamente
5. Verificar que el token nativo tiene el ID correcto
6. Verificar que el token nativo tiene la imagen correcta
7. Verificar que los tokens de red se muestran correctamente
8. Verificar que los tokens de red tienen los IDs e imágenes correctos

**Resultado esperado:** Tempo testnet muestra correctamente los tokens nativos y de red con sus IDs e imágenes correctos.

**Archivos relacionados:** `shared/constants/network.ts`, `ui/components/app/network-token/`

---

### TEST-014: Keycard Shell QR-based Hardware Wallet

**Prioridad:** Media  
**Tipo:** Funcional / Hardware  
**Área:** Hardware Wallets

**Descripción:** Verificar que Keycard Shell se puede conectar como hardware wallet basado en QR.

**Por qué se prueba:** Esta es una nueva opción de hardware wallet. Necesitamos verificar que se puede conectar correctamente y que funciona como se espera.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Ir al menú de cuentas y seleccionar "Connect Hardware Wallet"
3. Verificar que Keycard Shell aparece en la lista de opciones
4. Seleccionar Keycard Shell
5. Seguir el flujo de conexión (escanear QR, etc.)
6. Verificar que la conexión se establece correctamente
7. Verificar que se pueden derivar cuentas
8. Realizar una transacción de prueba con la cuenta de Keycard Shell
9. Verificar que la firma funciona correctamente

**Resultado esperado:** Keycard Shell se puede conectar correctamente como hardware wallet basado en QR y funciona como se espera.

**Archivos relacionados:** `app/scripts/lib/keycard-connect.ts`, `test/e2e/tests/hardware-wallets/qr-account.spec.ts`

**Notas:** Puede requerir un dispositivo Keycard Shell físico para pruebas completas.

---

## Cambios (Changed)

### TEST-015: Swap MM Fee Disclaimer Visibility basado en feeData Amount

**Prioridad:** Media  
**Tipo:** UI/UX / Funcional  
**Área:** Swaps / Fees

**Descripción:** Verificar que el disclaimer de fees de MM en swaps se muestra/oculta correctamente basado en la cantidad de feeData.

**Por qué se prueba:** Este cambio afecta la visibilidad de información importante sobre fees. Necesitamos verificar que el disclaimer aparece cuando corresponde y se oculta cuando no es necesario.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar a la funcionalidad de Swap
3. Configurar un swap con feeData amount que debería mostrar el disclaimer
4. Verificar que el disclaimer de MM fee es visible
5. Configurar un swap con feeData amount que NO debería mostrar el disclaimer
6. Verificar que el disclaimer de MM fee NO es visible
7. Probar con diferentes cantidades de feeData (límites, valores edge)
8. Verificar que el cálculo es correcto

**Resultado esperado:** El disclaimer de MM fee se muestra/oculta correctamente basado en la cantidad de feeData, mostrándose solo cuando es relevante.

**Archivos relacionados:** `ui/pages/swaps/swap-page.tsx`, `test/e2e/tests/swaps/`

---

## Correcciones (Fixed)

### TEST-016: Activity Log Header con Arrow Disclosure Variant

**Prioridad:** Baja  
**Tipo:** UI/UX  
**Área:** Activity / UI Components

**Descripción:** Verificar que el header del Activity Log usa la variante de arrow disclosure para mejor consistencia de UX.

**Por qué se prueba:** Este es un cambio de UI para mejorar la consistencia. Necesitamos verificar que el header se ve correctamente y funciona como se espera.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar a la página de Activity (historial de transacciones)
3. Verificar que el header del Activity Log usa la variante de arrow disclosure
4. Verificar que el arrow disclosure funciona correctamente (expandir/colapsar)
5. Verificar que la UI es consistente con otros componentes similares
6. Verificar que no hay problemas de accesibilidad

**Resultado esperado:** El header del Activity Log usa correctamente la variante de arrow disclosure y funciona como se espera.

**Archivos relacionados:** `ui/components/app/activity-log-header/`

---

### TEST-017: Área Clickeable Aumentada para Botones de Cerrar en Asset List

**Prioridad:** Baja  
**Tipo:** UI/UX / Accesibilidad  
**Área:** Assets / UI Components

**Descripción:** Verificar que el área clickeable de los botones de cerrar en la barra de control de asset list ha aumentado.

**Por qué se prueba:** Este cambio mejora la UX y accesibilidad al hacer los botones más fáciles de hacer clic. Necesitamos verificar que el área clickeable es mayor y que funciona correctamente.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar a la lista de assets
3. Verificar que hay botones de cerrar en la barra de control
4. Verificar que el área clickeable de los botones de cerrar es mayor (más fácil de hacer clic)
5. Hacer clic en diferentes áreas del botón (no solo el centro) y verificar que funciona
6. Verificar que la UI no se ve afectada negativamente
7. Verificar en diferentes tamaños de pantalla

**Resultado esperado:** El área clickeable de los botones de cerrar ha aumentado, mejorando la UX sin afectar la apariencia visual.

**Archivos relacionados:** `ui/components/app/asset-list-control-bar/`

---

### TEST-018: Token Activity en Details Page

**Prioridad:** Alta  
**Tipo:** Funcional / Bug Fix  
**Área:** Tokens / Activity

**Descripción:** Verificar que la actividad de tokens se muestra correctamente en la página de detalles.

**Por qué se prueba:** Este es un bug fix importante. La actividad de tokens faltante afecta la funcionalidad principal. Necesitamos verificar que ahora se muestra correctamente.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Tener tokens con actividad (transacciones previas)
3. Navegar a la página de detalles de un token
4. Verificar que la sección de actividad está visible
5. Verificar que las transacciones de tokens se listan correctamente
6. Verificar que los detalles de cada transacción son correctos
7. Verificar que la actividad se actualiza después de nuevas transacciones
8. Probar con diferentes tipos de tokens (ERC20, etc.)
9. Probar con tokens sin actividad (verificar que muestra mensaje apropiado)

**Resultado esperado:** La actividad de tokens se muestra correctamente en la página de detalles con todas las transacciones relevantes.

**Archivos relacionados:** `ui/pages/token-details/`, `test/e2e/tests/tokens/token-details.spec.ts`

**Notas:** Este es un bug fix crítico, verificar especialmente que funciona en diferentes escenarios.

---

### TEST-019: Permisos de Cámara con Keystone HW Wallet en Sidebar Mode

**Prioridad:** Media  
**Tipo:** Funcional / Bug Fix  
**Área:** Hardware Wallets / Permissions

**Descripción:** Verificar que los permisos de cámara funcionan correctamente con Keystone HW wallet en modo sidebar.

**Por qué se prueba:** Este bug afectaba la funcionalidad de Keystone en modo sidebar. Necesitamos verificar que ahora funciona correctamente y que los permisos de cámara se solicitan/usan apropiadamente.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Ir al menú de cuentas y seleccionar "Connect Hardware Wallet"
3. Seleccionar Keystone
4. Verificar que se solicita permiso de cámara (si es necesario)
5. Conceder permiso de cámara
6. Verificar que el flujo de conexión funciona en modo sidebar
7. Verificar que el escaneo de QR funciona correctamente
8. Verificar que se pueden derivar cuentas
9. Realizar una transacción de prueba
10. Verificar que no hay errores relacionados con permisos de cámara

**Resultado esperado:** Los permisos de cámara funcionan correctamente con Keystone en modo sidebar y el flujo de conexión funciona sin problemas.

**Archivos relacionados:** `app/scripts/lib/keystone-connect.ts`, `test/e2e/tests/hardware-wallets/qr-account.spec.ts`

---

### TEST-020: Subscription Reload al Cerrar Shield Payment Update Stripe Tab

**Prioridad:** Media  
**Tipo:** Funcional / Bug Fix  
**Área:** Shield / Payments

**Descripción:** Verificar que la suscripción se recarga correctamente cuando el usuario cierra la pestaña de actualización de pago de Shield en Stripe.

**Por qué se prueba:** Este bug afectaba el estado de la suscripción cuando el usuario cerraba la pestaña. Necesitamos verificar que el estado se actualiza correctamente.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar a Shield settings
3. Iniciar un flujo de actualización de método de pago
4. Verificar que se abre una pestaña de Stripe
5. Cerrar la pestaña de Stripe (sin completar el pago)
6. Volver a MetaMask
7. Verificar que la suscripción se recarga correctamente
8. Verificar que el estado de la suscripción es correcto
9. Verificar que no hay errores en la consola
10. Verificar que la UI muestra el estado correcto

**Resultado esperado:** La suscripción se recarga correctamente cuando se cierra la pestaña de Stripe y el estado se mantiene consistente.

**Archivos relacionados:** `app/scripts/controllers/shield-controller.ts`, `test/e2e/tests/shield/`

---

### TEST-021: Fullscreen Rendering de Dapp Connections Pages

**Prioridad:** Media  
**Tipo:** UI/UX / Bug Fix  
**Área:** Permissions / Layout

**Descripción:** Verificar que las páginas de Dapp Connections se renderizan correctamente en fullscreen usando DefaultLayout en lugar de LegacyLayout.

**Por qué se prueba:** Este bug afectaba el renderizado de las páginas de conexiones. Necesitamos verificar que ahora se renderizan correctamente en fullscreen.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar a la página de conexiones (Settings > Connected Sites)
3. Verificar que la página se renderiza correctamente en fullscreen
4. Verificar que el layout es correcto (DefaultLayout, no LegacyLayout)
5. Verificar que todos los elementos son visibles y accesibles
6. Verificar que no hay problemas de scroll o layout
7. Probar en diferentes tamaños de ventana
8. Verificar que la navegación funciona correctamente

**Resultado esperado:** Las páginas de Dapp Connections se renderizan correctamente en fullscreen con el layout correcto.

**Archivos relacionados:** `ui/pages/permissions/permission-list-page/`

---

### TEST-022: EIP-7702 Delegation Publish Transactions No Se Droppean

**Prioridad:** Alta  
**Tipo:** Funcional / Bug Fix  
**Área:** Transactions / EIP-7702

**Descripción:** Verificar que las transacciones de publicación de delegación EIP-7702 no se droppean incorrectamente.

**Por qué se prueba:** Este es un bug crítico que causaba que transacciones importantes se droppearan. Necesitamos verificar que ahora funcionan correctamente.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Crear una transacción de delegación EIP-7702
3. Verificar que la transacción no se droppea
4. Verificar que la transacción se procesa correctamente
5. Verificar que el nonce se maneja correctamente (no se incluye en txParams)
6. Verificar que la transacción aparece en el historial
7. Verificar que el estado se actualiza correctamente después de la transacción

**Resultado esperado:** Las transacciones de delegación EIP-7702 no se droppean y se procesan correctamente.

**Archivos relacionados:** `app/scripts/lib/transaction-controller.ts`

**Notas:** Este es un bug fix crítico. Puede requerir configuración especial para probar EIP-7702.

---

### TEST-023: Cancel and Speedup Modal UI

**Prioridad:** Baja  
**Tipo:** UI/UX / Bug Fix  
**Área:** Transactions / Modals

**Descripción:** Verificar que el modal de cancel y speedup tiene la UI correcta (sin emojis, botones estandarizados, componentes actualizados).

**Por qué se prueba:** Este bug fix mejora la UI del modal. Necesitamos verificar que los cambios se aplicaron correctamente y que la UI es consistente.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Crear una transacción pendiente
3. Intentar cancelar o hacer speedup de la transacción
4. Verificar que el modal se abre
5. Verificar que no hay emojis en el modal
6. Verificar que los botones tienen ancho estandarizado
7. Verificar que el modal usa componentes actualizados
8. Verificar que la UI es consistente con otros modales
9. Verificar que el modal funciona correctamente (cancelar/speedup)

**Resultado esperado:** El modal de cancel y speedup tiene la UI correcta sin emojis, con botones estandarizados y componentes actualizados.

**Archivos relacionados:** `ui/components/app/cancel-speedup-modal/`

---

### TEST-024: Snap Account Creation usa Account Group Names

**Prioridad:** Media  
**Tipo:** Funcional / Bug Fix  
**Área:** Snaps / Accounts

**Descripción:** Verificar que la creación de cuentas de Snap usa nombres de grupos de cuentas en lugar de nombres antiguos de cuentas.

**Por qué se prueba:** Este cambio afecta cómo se nombran las cuentas de Snap. Necesitamos verificar que los nombres son correctos y consistentes.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Instalar un Snap que permita crear cuentas
3. Crear una nueva cuenta de Snap
4. Verificar que la cuenta usa el nombre del grupo de cuentas (no el nombre antiguo)
5. Verificar que el nombre es correcto y consistente
6. Crear múltiples cuentas de Snap y verificar que los nombres son correctos
7. Verificar que los nombres aparecen correctamente en la lista de cuentas
8. Verificar que los nombres aparecen correctamente en otros lugares (transacciones, etc.)

**Resultado esperado:** Las cuentas de Snap se crean con nombres de grupos de cuentas correctos y consistentes.

**Archivos relacionados:** `app/scripts/controllers/snap-accounts-controller.ts`, `test/e2e/tests/account/create-snap-account.spec.ts`

---

### TEST-025: Edit Gas Fee Popover UI

**Prioridad:** Baja  
**Tipo:** UI/UX / Bug Fix  
**Área:** Gas / Modals

**Descripción:** Verificar que el popover de edición de gas fee tiene la UI correcta (sin fondos negros, migrado a Modal component).

**Por qué se prueba:** Este bug fix mejora la UI del popover. Necesitamos verificar que los cambios se aplicaron correctamente.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Crear una transacción
3. Intentar editar el gas fee
4. Verificar que el popover/modal se abre
5. Verificar que no hay fondos negros
6. Verificar que el componente usa Modal (no Popover antiguo)
7. Verificar que la UI es consistente
8. Verificar que la funcionalidad funciona correctamente (editar gas fee)
9. Verificar que el modal se cierra correctamente

**Resultado esperado:** El popover de edición de gas fee tiene la UI correcta sin fondos negros y usa el componente Modal actualizado.

**Archivos relacionados:** `ui/components/app/edit-gas-fee-modal/`

---

### TEST-026: SRP Validation durante Import

**Prioridad:** Alta  
**Tipo:** Seguridad / Funcional  
**Área:** Onboarding / Security

**Descripción:** Verificar que la validación de SRP (Seed Recovery Phrase) funciona correctamente durante la importación.

**Por qué se prueba:** Este es un cambio de seguridad importante. La validación de SRP previene importaciones incorrectas o maliciosas. Necesitamos verificar que funciona correctamente.

**Pasos de prueba:**
1. Abrir MetaMask (sin wallet)
2. Seleccionar "Import Wallet"
3. Intentar importar con un SRP inválido (palabras incorrectas, formato incorrecto, etc.)
4. Verificar que aparece un error de validación
5. Verificar que el error es claro y útil
6. Intentar importar con un SRP válido
7. Verificar que la importación funciona correctamente
8. Verificar que la wallet se importa correctamente
9. Probar con diferentes casos edge (SRP parcialmente incorrecto, etc.)

**Resultado esperado:** La validación de SRP funciona correctamente durante la importación, rechazando SRPs inválidos y permitiendo SRPs válidos.

**Archivos relacionados:** `app/scripts/lib/srp-validation.ts`, `test/e2e/tests/onboarding/`

**Notas:** Este es un cambio de seguridad crítico. Verificar especialmente casos edge y mensajes de error.

---

### TEST-027: Restore Swap Quote solo en Popup Mode

**Prioridad:** Media  
**Tipo:** Funcional / Bug Fix  
**Área:** Swaps / State Management

**Descripción:** Verificar que el swap quote se restaura solo cuando se usa la extensión en modo popup.

**Por qué se prueba:** Este bug fix previene que el quote se restaure incorrectamente en otros modos. Necesitamos verificar que funciona correctamente en popup mode y no en otros modos.

**Pasos de prueba:**
1. Abrir MetaMask en modo popup y desbloquear la wallet
2. Navegar a la funcionalidad de Swap
3. Configurar un swap y obtener un quote
4. Cerrar el popup
5. Abrir el popup nuevamente
6. Verificar que el swap quote se restaura correctamente
7. Probar en modo fullscreen y verificar que el quote NO se restaura (o se comporta diferente)
8. Verificar que no hay errores relacionados

**Resultado esperado:** El swap quote se restaura correctamente solo en modo popup y no en otros modos.

**Archivos relacionados:** `ui/pages/swaps/swap-page.tsx`, `test/e2e/tests/swaps/`

---

### TEST-028: Performance - Props References Estabilizadas en Routes

**Prioridad:** Alta  
**Tipo:** Performance / Bug Fix  
**Área:** Performance / Routing

**Descripción:** Verificar que el problema de rendimiento causado por props references inestables en routes se ha corregido.

**Por qué se prueba:** Este es un bug crítico de rendimiento que ralentizaba todas las acciones del usuario. Necesitamos verificar que el rendimiento ha mejorado.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar entre diferentes páginas/rutas
3. Verificar que la navegación es rápida y fluida
4. Realizar acciones del usuario (enviar transacciones, cambiar cuentas, etc.)
5. Verificar que las acciones son rápidas (no hay lag)
6. Verificar en React DevTools que no hay re-renders innecesarios
7. Verificar que las props references son estables
8. Comparar el rendimiento con versiones anteriores (si es posible)

**Resultado esperado:** El rendimiento ha mejorado significativamente, las acciones del usuario son rápidas y no hay re-renders innecesarios.

**Archivos relacionados:** `ui/pages/routes/`

**Notas:** Este es un bug fix crítico de rendimiento. Puede requerir herramientas de profiling para verificar completamente.

---

### TEST-029: RPC Method `metamask_sendDomainMetadata` No Tiene Efecto

**Prioridad:** Baja  
**Tipo:** Funcional / Bug Fix  
**Área:** RPC / API

**Descripción:** Verificar que llamar al método RPC `metamask_sendDomainMetadata` ya no tiene ningún efecto.

**Por qué se prueba:** Este cambio desactiva un método RPC. Necesitamos verificar que el método ya no funciona y que no causa errores.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Conectar a un dapp que intente llamar a `metamask_sendDomainMetadata`
3. Verificar que la llamada no tiene efecto
4. Verificar que no hay errores en la consola
5. Verificar que el método devuelve una respuesta apropiada (o no responde)
6. Verificar que otros métodos RPC siguen funcionando correctamente

**Resultado esperado:** El método RPC `metamask_sendDomainMetadata` ya no tiene efecto y no causa errores.

**Archivos relacionados:** `app/scripts/lib/rpc-methods.ts`

---

### TEST-030: MetaMetrics Context Causando Cascade Re-renders

**Prioridad:** Alta  
**Tipo:** Performance / Bug Fix  
**Área:** Metrics / Performance

**Descripción:** Verificar que el problema de rendimiento causado por MetaMetrics context causando re-renders en cascada de 149 suscriptores se ha corregido.

**Por qué se prueba:** Este es un bug crítico de rendimiento que causaba re-renders masivos en cada navegación. Necesitamos verificar que el rendimiento ha mejorado significativamente.

**Pasos de prueba:**
1. Abrir MetaMask y desbloquear la wallet
2. Navegar entre diferentes páginas
3. Verificar en React DevTools que no hay re-renders en cascada masivos
4. Verificar que el número de componentes que se re-renderizan es razonable
5. Verificar que la navegación es rápida
6. Verificar que las acciones del usuario son rápidas
7. Verificar que MetaMetrics sigue funcionando correctamente (tracking, etc.)
8. Comparar el rendimiento con versiones anteriores (si es posible)

**Resultado esperado:** El problema de re-renders en cascada se ha corregido, el rendimiento ha mejorado significativamente y MetaMetrics sigue funcionando correctamente.

**Archivos relacionados:** `ui/store/metametrics-context.tsx`

**Notas:** Este es un bug fix crítico de rendimiento. Requiere herramientas de profiling para verificar completamente.

---

## Pruebas de Regresión

### TEST-031: Regresión General - Funcionalidades Principales

**Prioridad:** Alta  
**Tipo:** Regresión  
**Área:** General

**Descripción:** Verificar que las funcionalidades principales no se han roto con los cambios de esta release.

**Por qué se prueba:** Es importante verificar que los cambios no han introducido regresiones en funcionalidades críticas.

**Pasos de prueba:**
1. **Onboarding:**
   - Crear nueva wallet
   - Importar wallet existente
   - Verificar que el flujo funciona correctamente

2. **Transacciones:**
   - Enviar ETH
   - Enviar tokens ERC20
   - Enviar NFTs
   - Verificar que las transacciones se procesan correctamente

3. **Swaps:**
   - Realizar un swap
   - Verificar que funciona correctamente

4. **Dapps:**
   - Conectar a un dapp
   - Realizar transacciones desde dapp
   - Verificar que funciona correctamente

5. **Settings:**
   - Cambiar configuración
   - Verificar que se guarda correctamente

6. **Networks:**
   - Añadir red personalizada
   - Cambiar de red
   - Verificar que funciona correctamente

**Resultado esperado:** Todas las funcionalidades principales funcionan correctamente sin regresiones.

---

### TEST-032: Regresión - Hardware Wallets

**Prioridad:** Alta  
**Tipo:** Regresión  
**Área:** Hardware Wallets

**Descripción:** Verificar que los hardware wallets (especialmente Ledger con el cambio a WebHID) funcionan correctamente.

**Por qué se prueba:** El cambio de Ledger a WebHID es significativo y podría afectar otros hardware wallets o funcionalidades relacionadas.

**Pasos de prueba:**
1. **Ledger:**
   - Conectar Ledger
   - Derivar cuentas
   - Firmar transacciones
   - Verificar que funciona correctamente

2. **Trezor:**
   - Conectar Trezor
   - Derivar cuentas
   - Firmar transacciones
   - Verificar que funciona correctamente

3. **Keystone:**
   - Conectar Keystone
   - Verificar permisos de cámara
   - Derivar cuentas
   - Firmar transacciones
   - Verificar que funciona correctamente

4. **Keycard Shell:**
   - Conectar Keycard Shell
   - Derivar cuentas
   - Firmar transacciones
   - Verificar que funciona correctamente

**Resultado esperado:** Todos los hardware wallets funcionan correctamente.

---

### TEST-033: Regresión - Performance

**Prioridad:** Alta  
**Tipo:** Regresión / Performance  
**Área:** Performance

**Descripción:** Verificar que los cambios de performance no han introducido nuevos problemas de rendimiento.

**Por qué se prueba:** Los cambios de performance son críticos y necesitamos verificar que no han introducido nuevos problemas.

**Pasos de prueba:**
1. Abrir MetaMask y medir tiempo de carga inicial
2. Navegar entre páginas y medir tiempos de respuesta
3. Realizar acciones del usuario y medir tiempos de respuesta
4. Verificar en React DevTools que no hay re-renders innecesarios
5. Verificar que no hay memory leaks
6. Verificar que el uso de CPU es razonable
7. Comparar con versiones anteriores (si es posible)

**Resultado esperado:** El rendimiento es igual o mejor que versiones anteriores, sin nuevos problemas de performance.

---

## Resumen de Prioridades

### Prioridad Alta (Crítico - Debe probarse)
- TEST-002: Ledger Connectivity con WebHID
- TEST-004: Botón "Disconnect All" en Dapp Connections
- TEST-018: Token Activity en Details Page
- TEST-022: EIP-7702 Delegation Publish Transactions
- TEST-026: SRP Validation durante Import
- TEST-028: Performance - Props References
- TEST-030: MetaMetrics Context Re-renders
- TEST-031: Regresión General
- TEST-032: Regresión Hardware Wallets
- TEST-033: Regresión Performance

### Prioridad Media (Importante - Debe probarse)
- TEST-001: Sanitized Origin en Sentinel Metadata
- TEST-003: Shield Notification en App Navigation
- TEST-006: Warning Message para Gas Sponsorship
- TEST-007: Transaction History UI para Perps
- TEST-010: Reset Shield Default Payment Method
- TEST-011: Cache Bridge getToken Responses
- TEST-012: Deeplinking al NFT Tab
- TEST-014: Keycard Shell QR-based Hardware Wallet
- TEST-015: Swap MM Fee Disclaimer Visibility
- TEST-019: Permisos de Cámara con Keystone
- TEST-020: Subscription Reload Shield Payment
- TEST-021: Fullscreen Rendering Dapp Connections
- TEST-024: Snap Account Creation Account Group Names
- TEST-027: Restore Swap Quote solo en Popup Mode

### Prioridad Baja (Opcional - Puede probarse si hay tiempo)
- TEST-005: Static Assets Polling Controller
- TEST-008: Static Perps Order Entry (Feature Flag)
- TEST-009: Points Estimate History Tracking
- TEST-013: Tempo Testnet Native y Network Token IDs
- TEST-016: Activity Log Header Arrow Disclosure
- TEST-017: Área Clickeable Botones Cerrar
- TEST-023: Cancel and Speedup Modal UI
- TEST-025: Edit Gas Fee Popover UI
- TEST-029: RPC Method `metamask_sendDomainMetadata`

---

## Notas Adicionales

1. **Feature Flags:** Algunas funcionalidades pueden requerir feature flags habilitados. Verificar `.metamaskrc` o `.manifest-overrides.json` para configuración.

2. **Hardware Wallets:** Las pruebas de hardware wallets requieren dispositivos físicos. Si no están disponibles, verificar que el código de conexión funciona correctamente.

3. **Performance Testing:** Las pruebas de performance pueden requerir herramientas de profiling (React DevTools, Chrome DevTools) para verificar completamente.

4. **E2E Tests:** Muchas de estas pruebas pueden automatizarse como tests E2E. Considerar crear tests automatizados para las pruebas de prioridad alta.

5. **Browser Compatibility:** Verificar que los cambios funcionan en Chrome/Chromium (MV3) y Firefox (MV2) cuando corresponda.

6. **Test Builds:** Asegurarse de usar `yarn build:test` antes de ejecutar pruebas E2E.

---

## Checklist de Ejecución

- [ ] Todas las pruebas de Prioridad Alta completadas
- [ ] Todas las pruebas de Prioridad Media completadas
- [ ] Pruebas de Prioridad Baja completadas (opcional)
- [ ] Pruebas de regresión completadas
- [ ] Issues encontrados documentados
- [ ] Tests E2E creados para funcionalidades nuevas (si aplica)
- [ ] Documentación actualizada (si aplica)

---

**Fecha de creación:** 2026-02-06  
**Versión:** 1.0  
**Release:** 13.18.0
