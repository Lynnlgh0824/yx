#!/bin/zsh
cd "${0:A:h}/dist"
python3 -m http.server 5278 --bind 127.0.0.1
