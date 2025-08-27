#!/usr/bin/env python3
import http.server
import socketserver
import os
from urllib.parse import urlparse

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Redirecionar /editor/ para /editor/index.html
        if parsed_path.path == '/editor/' or parsed_path.path == '/editor':
            self.path = '/editor/index.html'
        
        return super().do_GET()

if __name__ == "__main__":
    PORT = 8080
    
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"Servidor rodando em http://localhost:{PORT}")
        print(f"Editor disponível em: http://localhost:{PORT}/editor/")
        httpd.serve_forever()
