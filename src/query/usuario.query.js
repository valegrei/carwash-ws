const QUERY = {
    SELECT_USUARIOS: 'SELECT * FROM usuarios ORDER BY fechareg DESC LIMIT 100',
    SELECT_USUARIO: 'SELECT * FROM usuarios WHERE idusuario = ?',
    CREATE_USUARIO: 'INSERT INTO usuarios(idtipousuario, correo, clave) VALUES (?,?,?)',
    UPDATE_USUARIOS: 'UPDATE usuarios SET nombres = ?, ape_paterno = ?, ape_materno = ?, razon_social = ?, nro_doc = ?, nro_cel1 = ?, nro_cel2 = ?',
    DELETE_USUARIOS: 'DELETE FROM usuarios WHERE idusuario = ?',
    CREATE_USUARIO_PROCEDURE: 'CALL create_and_return(?,?,?)'
}

export default QUERY;