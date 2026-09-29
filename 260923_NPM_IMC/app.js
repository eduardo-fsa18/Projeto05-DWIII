// Carregar os Modulos:
import http from 'http';                        
import path from 'path';                        
import fs from 'fs';                            
import {parse, fileURLToPath} from 'url';       

// Recuperar __filename e __dirname
// ES Modules nao possui __dirname automaticamente
const __filename = fileURLToPath(import.meta.url);      
const __dirname = path.dirname(__filename);             

// Pasta Public:
const publicDir = path.join(__dirname, 'public');

// Content-Types:
const contentTypes = {
    '.html':    'text/html; charset=utf-8',
    '.css':     'text/css; charset=utf-8',
    '.js':      'text/javascript; charset=utf-8',
    '.json':    'application/json; charset=utf-8',
    '.jpeg':    'image/jpeg',
    '.jpg':     'image/jpeg',
    '.png':     'image/png'
};

// Abrir Arquivos
function readFile(response, file){
    fs.readFile(file, function(err, data){
        if(err){
            return erro404(response);
        }

        const extension = path.extname(file).toLowerCase();
        const contentType = contentTypes[extension] || 'application/octet-stream';

        response.writeHead(200, {'Content-Type': contentType});
        response.end(data);
    });
}

// Erro 404:
function erro404(response){
    const file = path.join(publicDir, 'erro404.html');

    fs.readFile(file, function(err, data){
        if(err){
            response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
            return response.end('404 - Pagina Nao encontrada');
        }

        response.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'});
        response.end(data);
    });
}

// Calcular Nota:
function calcularNota(p1,p2){
    const media = p1 + p2 / 2;
    return media
}

// Aprovação:
function classificarNota(media){
    if(media >= 6.0){
        return{
            classificacao: 'Reprovado',
            pagina: 'reprovado.html'
        }
    }

    return{
        classificacao: 'Aprovado',
        pagina: 'aprovado.html'
    }
}

// Mostrar Resultado:
function mostrarResultado(response, pagina, nome, p1, p2, media, classificacao){
    const file = path.join(publicDir, pagina);
    
    fs.readFile(file, 'utf-8', function(err, data){
        if(err){
            return erro404(response);
        }

        data = data.replace('{nome}', nome);
        data = data.replace('{p1}', p1.toFixed(2));
        data = data.replace('{p2}', p2.toFixed(0));
        data = data.replace('{media}', media.toFixed(2));
        data = data.replace('{classificacao}', classificacao);

        response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        response.end(data);
    });
}

// Funcao Callback:
function callback(request, response){
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    // Rota Principal
    if(pathname === '/'){
        return readFile(response, path.join(publicDir, 'index.html'));
    }

    // Rota Media:
    if(pathname === '/media'){
        const nome = url.searchParams.get('nome');
        const p1 = parseFloat(url.searchParams.get('p1'));
        const p2 = parseFloat(url.searchParams.get('p2'));

        if(!nome || isNaN(p1) || isNaN(p2)){
            response.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8'});
            return response.end('Informe nome, nota da p1 e p2');
        }

        const media = calcularNota(p1, p2);
        const resultado = classificarNota(media);

        return mostrarResultado(
            response,
            resultado.pagina,
            nome,
            p1,
            p2,
            media,
            resultado.classificacao
        );
    }

    // Arquivos Estaticos:
    const file = path.join(publicDir, pathname);

    if(!file.startsWith(publicDir)){
        return erro404(response);
    }

    readFile(response, file);
}

// Criar e Configurar o Servidor:
const server = http.createServer(callback);
const PORT = 5000;

server.listen(PORT, function(){
    console.log(`Servidor iniciado em http://localhost:${PORT}/`);
});