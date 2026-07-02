window.onload = function () {
    cargarUsuarios();
}

function validar_formulario_restaurante() {
    let selectUsuario = $('#selectUsuario');
    let inputNombre = $('#inputNombre');
    let inputEspecialidad = $('#inputEspecialidad');
    let inputCiudad = $('#inputCiudad');
    let inputDireccion = $('#inputDireccion');
    let inputPuntuacion = $('#inputPuntuacion');
    let inputFechaVisita = $('#inputFechaVisita');
    let inputCostoPromedio = $('#inputCostoPromedio');
    let formularioValido = true;

    if (!validarInput(selectUsuario)) {
        formularioValido = false;
    }
    if (!validarInput(inputNombre)) {
        formularioValido = false;
    }
    if (!validarInput(inputEspecialidad)) {
        formularioValido = false;
    }
    if (!validarInput(inputCiudad)) {
        formularioValido = false;
    }
    if (!validarInput(inputDireccion)) {
        formularioValido = false;
    }
    if (!validarPuntuacion(inputPuntuacion)) {
        formularioValido = false;
    }
    if (!validarFechaVisita(inputFechaVisita)) {
        formularioValido = false;
    }
    if (!validarCostoPromedio(inputCostoPromedio)) {
        formularioValido = false;
    }

    if (formularioValido === true) {
        alert('Formulario Válido, enviando datos al servidor...')

        const elementoForm = $('#formularioRestaurante')[0];
        const dataForm = new FormData(elementoForm);
        const datos = Object.fromEntries(dataForm.entries());

        // El checkbox solo aparece en el FormData si está marcado
        datos.recomendado = $('#checkRecomendado').is(':checked');
        datos.puntuacion = Number(datos.puntuacion);
        datos.costoPromedio = Number(datos.costoPromedio);

        const enviarFormulario = async () => {
            try {
                const respuesta = await fetch("http://localhost:3000/guardarRestaurante", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datos)
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    window.location.href = './restaurantes.html'
                } else {
                    console.log('El servidor ha respondido: ', data);
                    alert('No fue posible registrar el restaurante: ' + (data.errores ? data.errores.join(', ') : data.message));
                }
            } catch (error) {
                console.log('Ha ocurrido el siguiente error: ', error)
            }
        }
        enviarFormulario();
    } else {
        alert('Complete todos los campos del formulario correctamente.')
    }
};

function validarInput(input) {
    if (input.val() === '') {
        input.addClass('is-invalid');
        return false;
    } else {
        input.removeClass('is-invalid');
        return true;
    }
}

function validarPuntuacion(input) {
    if (validarInput(input)) {
        const valor = Number(input.val());
        if (valor >= 1 && valor <= 5) {
            input.removeClass('is-invalid');
            return true;
        } else {
            input.addClass('is-invalid');
            return false;
        }
    }
}

function validarFechaVisita(input) {
    if (validarInput(input)) {
        const fecha = new Date(input.val());
        if (fecha <= new Date()) {
            input.removeClass('is-invalid');
            return true;
        } else {
            input.addClass('is-invalid');
            return false;
        }
    }
}

function validarCostoPromedio(input) {
    if (validarInput(input)) {
        const valor = Number(input.val());
        if (valor >= 0) {
            input.removeClass('is-invalid');
            return true;
        } else {
            input.addClass('is-invalid');
            return false;
        }
    }
}

// Carga el listado de usuarios para poblar el select del formulario
async function cargarUsuarios() {
    try {
        const respuesta = await fetch("http://localhost:3000/listadoUsuariosSimple");
        const datos = await respuesta.json();

        const select = $('#selectUsuario');
        datos.forEach(usuario => {
            const option = $("<option></option>", {
                'text': `${usuario.nombre} (${usuario.rut})`,
                'value': usuario._id
            });
            select.append(option);
        });

        if (!respuesta.ok) {
            throw new Error(respuesta.status);
        }
    } catch (error) {
        console.log('Ha ocurrido el siguiente error: ', error)
    }
}
