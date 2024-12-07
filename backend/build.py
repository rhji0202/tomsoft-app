import platform
import subprocess
import os

def get_spec_file():
    system = platform.system().lower()
    spec_map = {
        'windows': 'specs/background_remover.win.spec',
        'darwin': 'specs/background_remover.mac.spec',
        'linux': 'specs/background_remover.linux.spec'
    }
    return spec_map.get(system)

def build():
    spec_file = get_spec_file()
    if not spec_file:
        raise RuntimeError(f"Unsupported platform: {platform.system()}")
    
    subprocess.run(['pyinstaller', spec_file], check=True)

if __name__ == '__main__':
    build()