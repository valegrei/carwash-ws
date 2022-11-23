CREATE DATABASE IF NOT EXISTS carwashdb;

USE carwashdb;

DROP TABLE IF EXISTS usuarios;
/***********************************
    Definicion de Tablas
************************************/
/* Tipo de Documentos */
CREATE TABLE tipo_documento(
    idtipodocumento INT NOT NULL,
    nom_doc         VARCHAR(4) DEFAULT NULL,
    cnt_digitos     INTEGER DEFAULT NULL,
    idestado        TINYINT DEFAULT 1,
    PRIMARY KEY (idtipodocumento)
);

/* Tipo de Usuario */
CREATE TABLE tipo_usuario(
    idtipousuario       INT NOT NULL,
    nom_tipo_usuario    VARCHAR(25) DEFAULT NULL,
    idestado            TINYINT DEFAULT 1,
    PRIMARY KEY (idtipousuario)
);

/* Usuarios */
CREATE TABLE usuarios(
    idusuario       INT NOT NULL AUTO_INCREMENT,
    idtipousuario   INT NOT NULL,
    correo          VARCHAR(100) NOT NULL,
    clave           VARCHAR(100) NOT NULL,
    nombres         VARCHAR(100) DEFAULT NULL,
    ape_paterno     VARCHAR(50) DEFAULT NULL,
    ape_materno     VARCHAR(50) DEFAULT NULL,
    razon_social    VARCHAR(100) DEFAULT NULL,
    idtipodocumento INT DEFAULT NULL,
    nro_doc         VARCHAR(12) DEFAULT NULL,
    nro_cel1        VARCHAR(20) DEFAULT NULL,
    nro_cel2        VARCHAR(20) DEFAULT NULL,
    verificado      TINYINT DEFAULT 0,
    fechareg        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechamod        TIMESTAMP DEFAULT NULL,
    idestado        TINYINT DEFAULT 1,
    PRIMARY KEY (idusuario),
    CONSTRAINT UQ_Usuarios_Correo UNIQUE (correo),
    CONSTRAINT FK_Usuarios_TipoDocumento FOREIGN KEY
        idtipodocumento REFERENCES tipo_documento(idtipodocumento),
    CONSTRAINT FK_Usuarios_TipoUsuario FOREIGN KEY
        idtipousuario REFERENCES tipo_usuario(idtipousuario)
);

/* Direccion de Usuario */
CREATE TABLE direccion_usuario(
    iddireccionusuario  INT NOT NULL AUTO_INCREMENT,
    idusuario           INT NOT NULL,
    nom_direccion       VARCHAR(200) DEFAULT NULL,
    latitud             FLOAT(9,6) DEFAULT NULL,
    longitud            FLOAT(9,6) DEFAULT NULL,
    PRIMARY KEY (iddireccionusuario),
    CONSTRAINT FK_DireccionUsuario_Usuario FOREIGN KEY
        (idusuario) REFERENCES usuarios(idusuario)
);

/**********************************************
    Datos
**********************************************/
/* Tipo de documentos */
INSERT INTO tipo_documento(idtipodocumento, nom_doc, cnt_digitos)
VALUES (1, 'DNI', 8), (2, 'RUC', 11), (3, 'CEXT', 12);

/* Tipo de usuarios */
INSERT INTO tipo_usuario(idtipousuario, nom_tipo_usuario)
VALUES (1, 'Administrador'), (2, 'Cliente'), (3, 'Distribuidor');

/* Usuarios */


INSERT INTO usuarios(idtipousuario, correo, clave)
VALUES (1, 'valegreib@gmail.com', '123456789')

-- Store Procedures
DELIMITER //
CREATE PROCEDURE registrar(
    IN idtipousuario    INT,
    IN correo           VARCHAR(100),
    IN clave            CHAR(64)),
    IN razon_social     VARCHAR(100) DEFAULT NULL,
    IN idtipodocumento  INT DEFAULT NULL,
    IN nro_doc          VARCHAR(12) DEFAULT NULL,
    IN nro_cel1         VARCHAR(20) DEFAULT NULL,
    IN nro_cel2         VARCHAR(20) DEFAULT NULL,
     
BEGIN
    INSERT INTO usuarios(idtipousuario, correo, clave)
    VALUES (idtipousuario, correo, clave);

    SET @USUARIO_ID = LAST_INSERT_ID();

    SELECT * FROM usuarios WHERE idusuario=@USUARIO_ID;
END //
DELIMITER;