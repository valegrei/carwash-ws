CREATE DATABASE IF NOT EXISTS carwashdb;

USE carwashdb;

DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios(
    idusuario       INT NOT NULL AUTO_INCREMENT,
    idtipousuario   INT NOT NULL,
    correo          VARCHAR(100) NOT NULL,
    clave           VARCHAR(100) NOT NULL,
    nombres         VARCHAR(100) DEFAULT NULL,
    ape_paterno     VARCHAR(50) DEFAULT NULL,
    ape_materno     VARCHAR(50) DEFAULT NULL,
    razon_social    VARCHAR(50) DEFAULT NULL,
    nro_doc         VARCHAR(12) DEFAULT NULL,
    nro_cel1        VARCHAR(20) DEFAULT NULL,
    nro_cel2        VARCHAR(20) DEFAULT NULL,
    fechareg        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechamod        TIMESTAMP DEFAULT NULL,
    idestado        CHAR(1),
    PRIMARY KEY (idusuario),
    CONSTRAINT UQ_Usuarios_Correo UNIQUE (correo) 
);

-- Store Procedures
DELIMITER //
CREATE PROCEDURE create_and_return(
    IN idtipousuario INT,
    IN correo VARCHAR(100),
    IN clave VARCHAR(100))
BEGIN
    INSERT INTO usuarios(idtipousuario, correo, clave)
    VALUES (idtipousuario, correo, clave);

    SET @USUARIO_ID = LAST_INSERT_ID();

    SELECT * FROM usuarios WHERE idusuario=@USUARIO_ID;
END //
DELIMITER;