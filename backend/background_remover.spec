# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import numpy

block_cipher = None

# 인증서 경로 설정
CERT_PATH = os.path.abspath('../frontend/cert')  # PEM 파일이 있는 디렉토리

# SSL 관련 바이너리 경로 설정
if sys.platform == 'darwin':  # macOS
    openssl_root = os.popen('brew --prefix openssl').read().strip()
    ssl_lib_search_path = f"{openssl_root}/lib"
    if os.path.exists(ssl_lib_search_path):
        os.environ['DYLD_LIBRARY_PATH'] = ssl_lib_search_path
        os.environ['OPENSSL_ROOT_DIR'] = openssl_root

# NumPy 관련 hidden imports 수정
hidden_imports = [
    'requests',
    'urllib3',
    'certifi',
    '_ssl',
    'cryptography',
    'numpy',
    'numpy.core.multiarray',  # 명시적으로 추가
    'numpy.core.numeric',     # 명시적으로 추가
    'numpy.core.umath',       # 명시적으로 추가
    'numpy.random',
    'numpy.linalg',
]

numpy_core_dir = os.path.dirname(numpy.core.__file__)
numpy_libs = []

# NumPy 코어 라이브러리 파일들 추가
for file in os.listdir(numpy_core_dir):
    if file.endswith('.so') or file.endswith('.pyd') or file.endswith('.dylib'):
        full_path = os.path.join(numpy_core_dir, file)
        if os.path.isfile(full_path):  # 파일이 실제로 존재하는지 확인
            numpy_libs.append((full_path, 'numpy/core'))

a = Analysis(
    ['scripts/background_remover.py'],
    pathex=[],
    binaries=numpy_libs,
    datas=[
        *collect_data_files('certifi'),
        (CERT_PATH, 'cert'),
        *collect_data_files('numpy'),
        *collect_data_files('onnxruntime'),  # onnxruntime 데이터 파일 추가
    ],
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

# SSL 관련 바이너리 추가
if sys.platform == 'darwin':  # macOS
    openssl_root = os.popen('brew --prefix openssl').read().strip()
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
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
