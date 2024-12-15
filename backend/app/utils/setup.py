# setup.py
from setuptools import setup, Extension

module = Extension('password_hash',
                   sources=['password_hash.c'],
                   libraries=['ssl', 'crypto'])  # OpenSSL 라이브러리 링크

setup(name='PasswordHash',
      version='1.0',
      description='C extension for password hashing',
      ext_modules=[module])
