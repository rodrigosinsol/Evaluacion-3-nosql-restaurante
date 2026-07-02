window.onload = function () {
    obtenerUsuarios();
}

async function obtenerUsuarios() {
    try {
        const respuesta = await fetch("http://localhost:3000/listadoUsuarios");
        const datos = await respuesta.json();
        console.log(datos)

        new DataTable('#tablaUsuarios', {
            data: datos,
            columns: [
                { data: 'nombre' },
                { data: 'rut' },
                { data: 'correo' },
                { data: 'telefono' },
                { data: 'fechaNacimiento' },
                { data: 'gentilicio.nombre' },
                { data: 'genero' },
                {
                    data: 'activo',
                    render: (activo) => activo ? 'Sí' : 'No'
                }
            ]
        });

        if (!respuesta.ok) {
            throw new Error(respuesta.status);
        }
    } catch (error) {
        console.log('Ha ocurrido el siguiente error: ', error)
    }
};