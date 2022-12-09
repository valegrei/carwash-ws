const queryDesactivarFotos = `
    UPDATE archivos AS a
    INNER JOIN usuarios AS u
    ON a.id = u.idArchivoFoto
    SET a.estado = 0
    WHERE u.id = :idUsuario ANd a.estado = 1
`;

const querySeleccionarUsuario = `
    SELECT u.id, u.correo, u.nombres, u.apellidoPaterno, u.apellidoMaterno,
        u.razonSocial,u.idTipoDocumento ,u.nroDocumento, u.nroCel1, u.nroCel2,
        a.nombre nombreArchivo, u.distAct, u.verificado, u.estado, u.idTipoUsuario,
        u.createdAt, u.updatedAt
    FROM usuarios AS u
    LEFT JOIN archivos AS a ON a.id = u.idArchivoFoto
    WHERE u.id = :idUsuario ANd u.estado = 1
    LIMIT 1;
`;

const querySeleccionarUsuarioCorreo = `
    SELECT u.id, u.correo, u.clave, u.nombres, u.apellidoPaterno, u.apellidoMaterno,
        u.razonSocial,u.idTipoDocumento ,u.nroDocumento, u.nroCel1, u.nroCel2,
        a.nombre nombreArchivo, u.distAct, u.verificado, u.estado, u.idTipoUsuario,
        u.createdAt, u.updatedAt
    FROM usuarios AS u
    LEFT JOIN archivos AS a ON a.id = u.idArchivoFoto
    WHERE u.correo = :correo ANd u.estado = 1
    LIMIT 1;
`;

module.exports = {queryDesactivarFotos, querySeleccionarUsuario, querySeleccionarUsuarioCorreo};