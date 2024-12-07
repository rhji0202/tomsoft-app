# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import numpy

block_cipher = None

CERT_PATH = os.path.abspath('../../frontend/cert')

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
    if file.endswith('.so'):  # Linux는 .so 파일 사용
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