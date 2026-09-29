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

// Calcular IMC:
function calcularIMC(peso, alturaCm){
    const altura = alturaCm / 100;
    return peso / (altura * altura);
}

// Classificar IMC:
function classificarIMC(imc){
    if(imc < 18.5){
        return{
            classificacao: 'Abaixo do Peso',
            pagina: 'abaixodopeso.html'
        }
    }

    if(imc < 25){
        return{
            classificacao: 'Peso Normal',
            pagina: 'pesonormal.html'
        }
    }

    if(imc < 30){
        return{
            classificacao: 'Sobrepeso',
            pagina: 'sobrepeso.html'
        }
    }

    if(imc < 35){
        return{
            classificacao: 'Obesidade Grau I',
            pagina: 'obesidade1.html'
        }
    }

    if(imc < 40){
        return{
            classificacao: 'Obesidade Grau II',
            pagina: 'obesidade2.html'
        }
    }

    return{
        classificacao: 'Obesidade Grau III',
        pagina: 'obesidade3.html'
    }
}

// Mostrar Resultado:
function mostrarResultado(response, pagina, nome, peso, altura, imc, classificacao){
    const file = path.join(publicDir, pagina);
    
    fs.readFile(file, 'utf-8', function(err, data){
        if(err){
            return erro404(response);
        }

        data = data.replace('{nome}', nome);
        data = data.replace('{peso}', peso.toFixed(2));
        data = data.replace('{altura}', altura.toFixed(0));
        data = data.replace('{imc}', imc.toFixed(2));
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

    // Rota IMC:
    if(pathname === '/imc'){
        const nome = url.searchParams.get('nome');
        const peso = parseFloat(url.searchParams.get('peso'));
        const altura = parseFloat(url.searchParams.get('altura'));

        if(!nome || isNaN(peso) || isNaN(altura)){
            response.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8'});
            return response.end('Informe nome, peso e altura na URL');
        }

        const imc = calcularIMC(peso, altura);
        const resultado = classificarIMC(imc);

        return mostrarResultado(
            response,
            resultado.pagina,
            nome,
            peso,
            altura,
            imc,
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