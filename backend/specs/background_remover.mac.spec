# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import numpy

block_cipher = None

CERT_PATH = os.path.abspath(os.path.join(os.getcwd(), '..', 'frontend', 'cert'))

# macOS OpenSSL 설정
openssl_root = os.popen('brew --prefix openssl').read().strip()
ssl_lib_search_path = f"{openssl_root}/lib"
if os.path.exists(ssl_lib_search_path):
    os.environ['DYLD_LIBRARY_PATH'] = ssl_lib_search_path
    os.environ['OPENSSL_ROOT_DIR'] = openssl_root

hidden_imports = [
    'requests',
    'urllib3',
    'certifi',
    '_ssl',
    'cryptography',
    'numpy',
    'numpy.core.multiarray',
    'numpy.core.numeric',
    'numpy.core.umath',
    'numpy.random',
    'numpy.linalg',
]

numpy_core_dir = os.path.dirname(numpy.core.__file__)
numpy_libs = []

for file in os.listdir(numpy_core_dir):
    if file.endswith('.so') or file.endswith('.dylib'):  # macOS는 .so 또는 .dylib 파일 사용
        full_path = os.path.join(numpy_core_dir, file)
        if os.path.isfile(full_path):
            numpy_libs.append((full_path, 'numpy/core'))

a = Analysis(
    ['../scripts/background_remover.py'],
    pathex=[],
    binaries=numpy_libs,
    datas=[
        *collect_data_files('certifi'),
        (CERT_PATH, 'cert'),
        *collect_data_files('numpy'),
        *collect_data_files('onnxruntime'),
    ],
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

# macOS OpenSSL 바이너리 추가
a.binaries = a.binaries + [
    ('libcrypto.dylib', f'{openssl_root}/lib/libcrypto.dylib', 'BINARY'),
    ('libssl.dylib', f'{openssl_root}/lib/libssl.dylib', 'BINARY')
]

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='background_remover',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=True,  # macOS에서는 True로 설정
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
) 