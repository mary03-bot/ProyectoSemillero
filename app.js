const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const dotenv = require('dotenv');
dotenv.config({path: './env/.env'});

app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

const bcryptjs = require('bcryptjs');

const session = require('express-session');

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(express.static('pag'));

const connection = require('./database/db');


function verificarRol(rolPermitido) {
    return (req, res, next) => {
        if (req.session.loggedin && req.session.rol === rolPermitido) {
            
            return next();
        }
        
        res.redirect('/login');
    };
}

// Middleware para deshabilitar el caché en las respuestas del servidor
app.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

// Ruta /admin (Protegida solo para Administradores)
app.get('/admin', verificarRol('admin'), (req, res) => {
    res.render('admin', { name: req.session.name });
});

// Ruta /docente (Protegida solo para Docentes)
app.get('/docente', verificarRol('docente'), (req, res) => {
    res.render('docente', { name: req.session.name });
});

// Ruta /estudiante (Protegida solo para Estudiantes)
app.get('/estudiante', verificarRol('estudiante'), (req, res) => {
    res.render('estudiante', { name: req.session.name });
});

app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/register', (req, res) => {
    res.render('register');
});

/*registro*/

app.post('/register', async (req, res) => {
    // 1. Leemos los datos enviados por el formulario activo
    const user = req.body.user;
    const name = req.body.name;
    const correo = req.body.correo;
    const password = req.body.password;
    
    // AQUÍ LLEGA EL ROL ('admin', 'docente' o 'estudiante' según el formulario enviado)
    const rol = req.body.rol; 

    // Si el formulario no envió codigo o programa (docente/admin), se asigna null
    const codigo = req.body.codigo ? req.body.codigo : null;
    const programa = req.body.programa ? req.body.programa : null;

    // 2. Encriptamos la contraseña
    let passwordHash = await bcryptjs.hash(password, 8);


    // 3. Guardamos en la base de datos phpMyAdmin
    const query = 'INSERT INTO users (user, name, correo, pass, rol, Codigo, Programa) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    connection.query(query, [user, name, correo, passwordHash, rol, codigo, programa], (error, results) => {
        if (error) {
            console.log(error);
            return res.send('Error en el registro');
        }
        res.render('register', {
            alert: true,
            alertTitle: "Registro",
            alertMessage: "¡Registro exitoso!",
            alertIcon: 'success',
            showConfirmButton: false,
            timer: 1500,
            ruta: ''
        })
    });
});

/*login*/
// Ruta GET para mostrar la vista del formulario de login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const password = req.body.password;

    let passwordHash = await bcryptjs.hash(password, 8);   

    if (user && password) {
        connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results) => {
            if (error) {
                console.log(error);
                return res.send('Error en la consulta');
            }

            if (results.length === 0 || !(await bcryptjs.compare(password, results[0].pass))) {
                res.render('login', {
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o contraseña incorrectos",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
            } else {
                req.session.loggedin = true;
                req.session.name = results[0].name;
                req.session.rol = results[0].rol;

                if (results[0].rol === 'admin') {
                    res.redirect('/admin');
                } else if (results[0].rol === 'docente') {
                    res.redirect('/docente');
                } else {
                    res.redirect('/estudiante');
                }
            }
        });
    }
});

/**/


app.listen(3000, (req, res) => {
    console.log('Server is running on port 3000 http://localhost:3000/login');
});