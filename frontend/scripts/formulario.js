window.onload = function () {
    cargarPaises();
    cargarComunas();
}

function validar_fomulario() {
    let inputNombre = $("#inputNombre");
    let inputRut = $('#inputRut');
    let inputEmail = $('#inputEmail');
    let fechaNacimiento = $('#inputFechaNac');
    let nacionalidad = $('#selectNacionalidad');
    let contrasena = $('#inputContrasena');
    let repetirContrasena = $('#inputRepetirContrasena');
    let comuna = $('#selectComuna');
    let calle = $('#inputCalle');
    let numero = $('#inputNumero');
    let formularioValido = true;

    if (!validarInput(inputNombre)) {
        formularioValido = false;
    }
    if (!validarRut(inputRut)) {
        formularioValido = false;
    }
    if (!validarEmail(inputEmail)) {
        formularioValido = false;
    }
    if (!validarInput(fechaNacimiento)) {
        formularioValido = false;
    }
    if (!validarFechaNacimiento(fechaNacimiento)) {
        formularioValido = false;
    }
    if (!validarInput(nacionalidad)) {
        formularioValido = false;
    }
    if (!validarContrasena(contrasena)) {
        formularioValido = false;
    }
    if (!validarRepetirContrasena(repetirContrasena, contrasena)) {
        formularioValido = false;
    }
    if (!validarInput(comuna)) {
        formularioValido = false;
    }
    if (!validarInput(calle)) {
        formularioValido = false;
    }
    if (!validarInput(numero)) {
        formularioValido = false;
    }

    if (formularioValido === true) {
        alert('Formulario Válido, enviando datos al servidor...')

        const elementoForm = $('#formularioRegistro')[0];
        const dataForm = new FormData(elementoForm);
        const datos = Object.fromEntries(dataForm.entries());

        // Armamos el objeto direccion anidado tal como lo espera el esquema de Usuario
        datos.direccion = {
            comuna: datos.comuna,
            calle: datos.calle,
            numero: datos.numero,
            departamento: datos.departamento || ''
        };
        delete datos.comuna;
        delete datos.calle;
        delete datos.numero;
        delete datos.departamento;
        delete datos.repetirContrasena;

        const enviarFomulario = async () => {
            try {
                const respuesta = await fetch("http://localhost:3000/guardarUsuario", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datos)
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    window.location.href = './inicio.html'
                } else {
                    console.log('El servidor ha respondido: ', data);
                    alert('No fue posible registrar el usuario: ' + (data.errores ? data.errores.join(', ') : data.message));
                }
            } catch (error) {
                console.log('Ha ocurrido el siguiente error: ', error)
            }
        }
        enviarFomulario();
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

function validarEmail(input) {
    if (validarInput(input)) {
        const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/
        if (regexEmail.test(input.val())) {
            input.removeClass('is-invalid');
            return true;
        } else {
            input.addClass('is-invalid');
            return false;
        }
    }
}

// Valida formato de RUT chileno (NNNNNNNN-D) y su dígito verificador
function validarRut(input) {
    if (validarInput(input)) {
        const rut = input.val().trim().toUpperCase();
        const regexRut = /^\d{7,8}-[0-9K]$/;

        if (!regexRut.test(rut)) {
            input.addClass('is-invalid');
            return false;
        }

        const [numero, dvIngresado] = rut.split('-');
        let suma = 0;
        let multiplo = 2;

        for (let i = numero.length - 1; i >= 0; i--) {
            suma += multiplo * parseInt(numero.charAt(i), 10);
            multiplo = multiplo < 7 ? multiplo + 1 : 2;
        }

        const resto = 11 - (suma % 11);
        let dvEsperado;
        if (resto === 11) dvEsperado = '0';
        else if (resto === 10) dvEsperado = 'K';
        else dvEsperado = resto.toString();

        if (dvEsperado === dvIngresado) {
            input.removeClass('is-invalid');
            return true;
        } else {
            input.addClass('is-invalid');
            return false;
        }
    }
}

// Valida que la fecha de nacimiento sea anterior a hoy
function validarFechaNacimiento(input) {
    if (validarInput(input)) {
        const fecha = new Date(input.val());
        if (fecha < new Date()) {
            input.removeClass('is-invalid');
            return true;
        } else {
            input.addClass('is-invalid');
            return false;
        }
    }
}

function validarContrasena(input) {
    if (validarInput(input)) {
        const regexContrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])([A-Za-z\d$@$!%*?&]|[^ ]){8,15}$/;
        if (regexContrasena.test(input.val())) {
            input.removeClass('is-invalid');
            return true;
        } else {
            input.addClass('is-invalid');
            return false;
        }
    }
}

function validarRepetirContrasena(input, input2) {
    if (validarInput(input)) {
        if (input.val() === input2.val()) {
            input.removeClass('is-invalid');
            return true;
        } else {
            input.addClass('is-invalid');
            return false;
        }
    }
}

async function cargarPaises() {
    try {
        const respuesta = await fetch("http://localhost:3000/listadoPaises");
        const datos = await respuesta.json();

        const select = $('#selectNacionalidad');
        datos.forEach(pais => {
            const option = $("<option></option>",{
                'text':pais.nombre,
                'value':pais.iso2
            });
            select.append(option.css("text-transform", "capitalize"));            
        });

        if (!respuesta.ok) {
            throw new Error(respuesta.status);
        }
    } catch (error) {
        console.log('Ha ocurrido el siguiente error: ', error)
    }
}

async function cargarComunas() {
    try {
        const respuesta = await fetch("http://localhost:3000/listadoComunas");
        const datos = await respuesta.json();

        const select = $('#selectComuna');
        datos.forEach(comuna => {
            const option = $("<option></option>",{
                'text':comuna.nombre_comuna,
                'value':comuna.codigo_comuna
            });
            select.append(option.css("text-transform", "capitalize"));            
        });

        if (!respuesta.ok) {
            throw new Error(respuesta.status);
        }
    } catch (error) {
        console.log('Ha ocurrido el siguiente error: ', error)
    }
}