# Ejercicio 2 de la Práctica 2

## 2. Caso de uso: Lotery con recibos en IPFS

En la práctica 1 hicimos **Lotery**, una lotería en blockchain donde los usuarios
compran boletos y participan en sorteos con smart contracts.

En la práctica 2, en el **Ejercicio 2**, lo que hemos hecho es añadir algo encima de eso:
queremos que el usuario tenga una **prueba extra de que ha participado**, guardando
una **captura de pantalla de su compra** en **IPFS**, y guardando en la blockchain el
**CID** de esa captura (el “código” que devuelve IPFS cuando subimos el archivo).

La idea es que, además de lo que ya se guarda en los contratos de Lotery, el usuario
tenga una especie de “ticket digital” guardado de forma descentralizada.

---

### 2.1 Descripción del caso de uso

1. El usuario entra en la dApp de **Lotery** y compra uno o varios boletos.
2. Al terminar, la aplicación le enseña un **resumen de la compra**  
   (sorteo, boletos, precio, dirección, etc.).
3. El usuario hace una **captura de pantalla** de ese resumen y la guarda en su PC.
4. Después abre la dApp del **Ejercicio 2** (el proyecto `app_final`, en `localhost:3000`).
5. En esa dApp selecciona la captura desde su ordenador y pulsa el botón **Upload**.
6. La dApp sube la imagen a **IPFS** (al nodo que tenemos en local) y recibe un **CID**.
7. Con ese CID, la dApp manda una transacción a un contrato muy simple que
   guarda ese CID asociado a la **dirección de Ethereum** del usuario (la que está en MetaMask).
8. Más adelante, si queremos comprobar la participación de ese usuario, podemos:
   - mirar en el contrato cuál es su CID,
   - e ir a IPFS con ese CID para ver la captura de la compra.

Así, la compra no solo se refleja en los contratos de Lotery, sino que además tenemos
una **evidencia visual** (la captura) guardada en IPFS y referenciada desde la blockchain.

---

### 2.2 Arquitectura y componentes

- **Usuario de Lotery**  
  Compra los boletos y luego sube la captura.

- **dApp de Lotery (Práctica 1)**  
  Es la app original donde se hacen las compras y se ve el resumen que luego
  capturamos.

- **dApp del Ejercicio 2 (`app_final`)**  
  Es una aplicación web sencilla (React) que se ejecuta en `http://localhost:3000` y:
  - deja elegir un archivo (la captura),
  - lo sube a IPFS,
  - y llama al contrato para guardar el CID.

- **Nodo IPFS local**  
  Lo tenemos en Docker (`ipfs_host`) y se puede ver con la WebUI en  
  `http://127.0.0.1:5001/webui`. Ahí vemos los ficheros subidos desde la dApp.

- **Contrato de apoyo (recibos)**  
  Es un contrato aparte de los de Lotery. No gestiona sorteos, solo guarda:
  - para cada dirección de Ethereum, un **string** con el CID de la captura que ha subido.

- **MetaMask + red de pruebas**  
  La dApp se conecta a MetaMask para saber qué cuenta está usando el usuario y para
  firmar la transacción cuando se guarda el CID.

---

### 2.3 Funcionamiento del sistema


#### 2.3.1 Generar la captura de participación

1. El usuario compra sus boletos en la dApp de Lotery como siempre.
2. Al terminar, ve el resumen de la compra en pantalla.
3. Hace una **captura de pantalla** de ese resumen y la guarda como imagen en su PC.


#### 2.3.2 Subida a IPFS y registro en la blockchain

1. El usuario abre la dApp del Ejercicio 2 (`app_final`) en `http://localhost:3000`.
2. En la página se explica que suba la captura de su compra para guardarla en IPFS como prueba.
3. Pulsa **Seleccionar archivo** y elige la captura.
4. Cuando pulsa **Upload**:
   - la dApp envía la imagen al nodo IPFS local,
   - IPFS devuelve un **CID** que identifica ese archivo,
   - y la dApp copia la imagen al sistema de ficheros del nodo, de forma que aparece
     en la pestaña *Files* de la WebUI de IPFS.
5. Después, la dApp pide a MetaMask que firme una transacción para guardar ese CID
   en el contrato de apoyo, asociado a la dirección del usuario.
6. Cuando la transacción se mina, el contrato ya tiene guardado el **CID** de la captura
   para esa dirección.

Una vez hecho:
- En la WebUI de IPFS (pestaña *Files*) podemos ver la captura subida.
- En la blockchain podemos consultar el CID guardado para cada dirección y recuperar
  la captura usando IPFS.

