const QUERY = {
    SELECT_USUARIO: 'SELECT * FROM usuarios WHERE correo = ? LIMIT 1',
    CREATE_USUARIO: 'INSERT INTO usuarios(idtipousuario, correo, clave) VALUES (?,?,?)'
}

export default QUERY;