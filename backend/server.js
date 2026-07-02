// Importación de dependencias para ejecutar nuestra app en backend
const express = require('express'); // Librería que permitye crear servidores JS
const cors = require('cors'); // Permite la ejecución de scripts desde fuera del servidor
const mongoose = require('mongoose'); // ORM (Object Relational Mapping) automatiza y oculta la creación de scripts de DB
const bcrypt = require('bcryptjs'); // Librería para hashear contraseñas de forma segura

// Iniciamos la aplicación Express
const app = express();
const puerto = 3000;

// Instanciamos las dependencias en nuestra aplicación
app.use(cors());
app.use(express.json());

// Conexión a DB
mongoose.connect('mongodb://localhost:27017/IEI_N3_C3', {}) // Url servidor local + nombre DB
    .then(() => console.log('Conexión Exitosa!'))
    .catch((err) => console.log('No se ha podido establecer la conexión con el servidor ', err));

// Test para ver que la app esté corriendo en el puerto indicado
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Puerto: ${PORT}`))

const comuna = new mongoose.Schema({
    codigo_comuna: String,
    nombre_comuna: String,
    codigo_postal: String,
    nombre_region: String
});
const Comuna = mongoose.model('Comuna', comuna, 'comunas');

// Función para validar RUT chileno (incluye dígito verificador)
function validarRut(rutCompleto) {
    if (typeof rutCompleto !== 'string') return false;
    if (!/^\d{7,8}-[\dkK]$/.test(rutCompleto)) return false;

    const [numero, dv] = rutCompleto.split('-');
    const dvIngresado = dv.toUpperCase();

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

    return dvEsperado === dvIngresado;
}

// Subdocumento de Dirección (objeto, no arreglo)
const direccion = new mongoose.Schema({
    comuna: {
        type: String,
        required: [true, 'La comuna es obligatoria.']
    },
    calle: {
        type: String,
        required: [true, 'La calle es obligatoria.']
    },
    numero: {
        type: String,
        required: [true, 'El número es obligatorio.']
    },
    departamento: {
        type: String,
        default: ''
    }
}, { _id: false });

const usuario = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio.'],
        trim: true
    },
    rut: {
        type: String,
        required: [true, 'El RUT es obligatorio.'],
        unique: true,
        validate: {
            validator: validarRut,
            message: props => `${props.value} no es un RUT chileno válido (formato esperado: 12345678-9).`
        }
    },
    correo: {
        type: String,
        required: [true, 'El correo es obligatorio.'],
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/, 'El correo ingresado no es válido.']
    },
    telefono: {
        type: String
    },
    fechaNacimiento: {
        type: Date,
        required: [true, 'La fecha de nacimiento es obligatoria.'],
        validate: {
            validator: function (valor) {
                return valor instanceof Date && !isNaN(valor) && valor < new Date();
            },
            message: 'La fecha de nacimiento debe ser una fecha válida y anterior a hoy.'
        }
    },
    nacionalidad: {
        type: String,
        required: [true, 'La nacionalidad es obligatoria.'],
        match: [/^[A-Z]{2}$/, 'La nacionalidad debe ser un código ISO-3166 Alpha-2 (ej: CL, AR, PE).']
    },
    genero: {
        type: String,
        enum: {
            values: ['M', 'F', 'O'],
            message: 'El género debe ser M, F u O.'
        }
    },
    direccion: {
        type: direccion,
        required: [true, 'La dirección es obligatoria.']
    },
    contrasena: {
        type: String,
        required: [true, 'La contraseña es obligatoria.']
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    activo: {
        type: Boolean,
        default: true
    }
});

// Hashear la contraseña con bcrypt antes de guardar el documento
usuario.pre('save', async function (next) {
    if (!this.isModified('contrasena')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.contrasena = await bcrypt.hash(this.contrasena, salt);
        next();
    } catch (err) {
        next(err);
    }
});

const Usuario = mongoose.model('Usuario', usuario, 'usuarios');

const pais = new mongoose.Schema(
    {
        nombre: String,
        iso2: String,
        iso3: String,
        codigoPais: String,
        nacionalidad: String
    }
);
const Pais = mongoose.model('Pais', pais, 'paises');

// Entidad Restaurante: relación 1:N con Usuario
// (un usuario puede tener cero o muchos restaurantes registrados;
// cada restaurante pertenece a un único usuario)
const restaurante = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El restaurante debe estar asociado a un usuario.']
    },
    nombre: {
        type: String,
        required: [true, 'El nombre del restaurante es obligatorio.'],
        trim: true
    },
    especialidad: {
        type: String,
        required: [true, 'La especialidad es obligatoria.'],
        trim: true
    },
    ciudad: {
        type: String,
        required: [true, 'La ciudad es obligatoria.'],
        trim: true
    },
    direccion: {
        type: String,
        required: [true, 'La dirección es obligatoria.'],
        trim: true
    },
    puntuacion: {
        type: Number,
        required: [true, 'La puntuación es obligatoria.'],
        min: [1, 'La puntuación mínima es 1.'],
        max: [5, 'La puntuación máxima es 5.']
    },
    fechaVisita: {
        type: Date,
        required: [true, 'La fecha de visita es obligatoria.'],
        validate: {
            validator: function (valor) {
                return valor instanceof Date && !isNaN(valor) && valor <= new Date();
            },
            message: 'La fecha de visita no puede ser futura.'
        }
    },
    costoPromedio: {
        type: Number,
        required: [true, 'El costo promedio es obligatorio.'],
        min: [0, 'El costo promedio no puede ser negativo.']
    },
    comentario: {
        type: String,
        trim: true,
        maxlength: [300, 'El comentario no puede superar los 300 caracteres.']
    },
    recomendado: {
        type: Boolean,
        default: false
    }
});
const Restaurante = mongoose.model('Restaurante', restaurante, 'restaurantes');

app.post('/guardarUsuario', async (req, res) => {
    try {
        const { nombre, rut, correo, telefono, fechaNacimiento, nacionalidad, genero, direccion, contrasena } = req.body;

        const nuevoUsuario = new Usuario({
            nombre,
            rut,
            correo,
            telefono,
            fechaNacimiento,
            nacionalidad,
            genero,
            direccion,
            contrasena
        });

        await nuevoUsuario.save();
        res.status(200).json({ message: 'Datos almacenados correctamente.' })
    } catch (err) {
        if (err.name === 'ValidationError') {
            const errores = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: 'Error de validación.', errores });
        }
        if (err.code === 11000) {
            return res.status(400).json({ message: 'El RUT o correo ya se encuentran registrados.' });
        }
        res.status(500).json({ message: 'No ha sido posible almacenar los datos: ', err })
    }
});

app.get('/listadoPaises', async (req, res) => {
    try {
        const paises = await Pais.find();
        res.status(200).json(paises)
    } catch (err) {
        res.status(500).send(err.message);
        res.status(500).json({ message: 'No ha sido posible obtener los datos: ', err })
    }
});

app.get('/listadoComunas', async (req, res) => {
    try {
        const comunas = await Comuna.find();
        res.status(200).json(comunas)
    } catch (err) {
        res.status(500).send(err.message);
        res.status(500).json({ message: 'No ha sido posible obtener los datos: ', err })
    }
});

app.get('/listadoUsuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.aggregate([{
            $lookup: {
                from: 'paises', // Colección que contiene la información referenciada
                localField: 'nacionalidad', // Campo que contiene la info referenciada
                foreignField: 'iso2', // Campo de la colección referenciada que queremos mostrar
                as: 'gentilicio' // Nombrar el dato (alias)
            }
        }, {
            $unwind: {
                path: '$gentilicio',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $project: {
                contrasena: 0 // Nunca exponemos la contraseña (ni siquiera hasheada) al frontend
            }
        }]);
        res.status(200).json(usuarios)
    } catch (err) {
        res.status(500).send(err.message);
        res.status(500).json({ message: 'No ha sido posible obtener los datos: ', err })
    }
});

app.get('/listadoUsuariosSimple', async (req, res) => {
    try {
        const usuarios = await Usuario.find({}, 'nombre rut');
        res.status(200).json(usuarios)
    } catch (err) {
        res.status(500).send(err.message);
        res.status(500).json({ message: 'No ha sido posible obtener los datos: ', err })
    }
});

app.post('/guardarRestaurante', async (req, res) => {
    try {
        const { usuario, nombre, especialidad, ciudad, direccion, puntuacion, fechaVisita, costoPromedio, comentario, recomendado } = req.body;

        // Verificamos que el usuario referenciado exista antes de crear la relación
        const usuarioExiste = await Usuario.findById(usuario);
        if (!usuarioExiste) {
            return res.status(400).json({ message: 'El usuario indicado no existe.' });
        }

        const nuevoRestaurante = new Restaurante({
            usuario,
            nombre,
            especialidad,
            ciudad,
            direccion,
            puntuacion,
            fechaVisita,
            costoPromedio,
            comentario,
            recomendado
        });

        await nuevoRestaurante.save();
        res.status(200).json({ message: 'Restaurante almacenado correctamente.' })
    } catch (err) {
        if (err.name === 'ValidationError') {
            const errores = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: 'Error de validación.', errores });
        }
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'El usuario indicado no es válido.' });
        }
        res.status(500).json({ message: 'No ha sido posible almacenar los datos: ', err })
    }
});

app.get('/listadoRestaurantes', async (req, res) => {
    try {
        const restaurantes = await Restaurante.aggregate([{
            $lookup: {
                from: 'usuarios', // Colección que contiene la información referenciada
                localField: 'usuario', // Campo que contiene el _id del usuario dueño del registro
                foreignField: '_id', // Campo de la colección referenciada que queremos enlazar
                as: 'datosUsuario' // Nombrar el dato (alias)
            }
        }, {
            $unwind: {
                path: '$datosUsuario',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $project: {
                nombre: 1,
                especialidad: 1,
                ciudad: 1,
                direccion: 1,
                puntuacion: 1,
                fechaVisita: 1,
                costoPromedio: 1,
                comentario: 1,
                recomendado: 1,
                'datosUsuario.nombre': 1,
                'datosUsuario.correo': 1
                // La contraseña del usuario nunca se incluye en este listado
            }
        }]);
        res.status(200).json(restaurantes)
    } catch (err) {
        res.status(500).send(err.message);
        res.status(500).json({ message: 'No ha sido posible obtener los datos: ', err })
    }
});
