window.onload = function () {
    obtenerRestaurantes();
}

async function obtenerRestaurantes() {
    try {
        const respuesta = await fetch("http://localhost:3000/listadoRestaurantes");
        const datos = await respuesta.json();
        console.log(datos)

        new DataTable('#tablaRestaurantes', {
            data: datos,
            columns: [
                { data: 'nombre' },
                { data: 'especialidad' },
                { data: 'ciudad' },
                { data: 'direccion' },
                { data: 'puntuacion' },
                { data: 'fechaVisita' },
                {
                    data: 'costoPromedio',
                    render: (costo) => costo != null ? `$${Number(costo).toLocaleString('es-CL')}` : ''
                },
                { data: 'comentario' },
                {
                    data: 'recomendado',
                    render: (recomendado) => recomendado ? 'Sí' : 'No'
                },
                { data: 'datosUsuario.nombre' }
            ]
        });

        if (!respuesta.ok) {
            throw new Error(respuesta.status);
        }
    } catch (error) {
        console.log('Ha ocurrido el siguiente error: ', error)
    }
};
