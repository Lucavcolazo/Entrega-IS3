const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();

const port = 3000;

// Configuración de multer para guardar archivos en la carpeta 'public/videos'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'videos'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para el archivo
    }
});
const upload = multer({ storage });

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
    const videosPath = path.join(__dirname, 'public', 'videos');

    // Leer la carpeta de videos
    fs.readdir(videosPath, (err, files) => {
        if (err) {
            return res.status(500).send('Error al leer la carpeta de videos');
        }

        // Filtrar solo archivos de video (por extensión)
        const videoFiles = files.filter(file => file.endsWith('.mp4') || file.endsWith('.mov'));

        // Generar la lista de videos en HTML
        let videoListHtml = videoFiles.map(file => {
            return `<li><a href="#" onclick="loadVideo('${file}'); return false;">${file}</a></li>`;
        }).join('');

        // Enviar el HTML completo al cliente
        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Netflix2.0</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <h1>Bienvenido a Netflix2.0</h1>
                
                <!-- Formulario para subir videos -->
                <h2>Subir un nuevo video:</h2>
                <form id="uploadForm" enctype="multipart/form-data">
                    <input type="file" id="videoFile" accept="video/*" required>
                    <button type="submit">Subir Video</button>
                </form>

                <h2>Selecciona un video que quieras ver:</h2>
                <ul id="videoList">
                    ${videoListHtml}
                </ul>

                <video id="videoPlayer" width="600" controls>
                    <source id="videoSource" src="" type="video/mp4">
                    <source id="videoSourceMov" src="" type="video/quicktime">
                    Tu navegador no soporta la reproducción de videos.
                </video>

                <footer>
                    Gracias por usarnos
                </footer>

                <script>
                    function loadVideo(video) {
                        const videoPlayer = document.getElementById('videoPlayer');
                        const videoSource = document.getElementById('videoSource');
                        const videoSourceMov = document.getElementById('videoSourceMov');
                        
                        // Establecer la fuente según la extensión del video
                        if (video.endsWith('.mov')) {
                            videoSource.src = ''; // Limpiar el src para mp4
                            videoSourceMov.src = '/videos/' + video; // Ruta para .mov
                        } else {
                            videoSource.src = '/videos/' + video; // Ruta para .mp4
                            videoSourceMov.src = ''; // Limpiar el src para .mov
                        }

                        videoPlayer.load(); // Cargar el nuevo video
                    }

                    // Manejar la carga de videos
                    document.getElementById('uploadForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        const fileInput = document.getElementById('videoFile');
                        const file = fileInput.files[0];

                        if (file) {
                            const formData = new FormData();
                            formData.append('video', file);

                            fetch('/upload', {
                                method: 'POST',
                                body: formData
                            })
                            .then(response => response.json())
                            .then(data => {
                                console.log(data);
                                // Recargar la lista de videos
                                window.location.reload(); // Recarga la página para mostrar el nuevo video
                            })
                            .catch(error => console.error('Error al subir el video:', error));
                        }
                    });
                </script>
            </body>
            </html>
        `);
    });
});

// Ruta para manejar la carga de videos
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
    }
    res.json({ message: 'Video subido con éxito', filename: req.file.filename });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
