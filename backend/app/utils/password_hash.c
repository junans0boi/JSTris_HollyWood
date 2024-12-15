// password_hash.c
#include <Python.h>
#include <string.h>
#include <openssl/sha.h>

// 비밀번호 해싱 함수 (SHA-256 예시)
static PyObject* hash_password(PyObject* self, PyObject* args) {
    const char* password;
    if (!PyArg_ParseTuple(args, "s", &password)) {
        return NULL;
    }

    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((unsigned char*)password, strlen(password), hash);

    // 해시를 16진수 문자열로 변환
    char hex_hash[SHA256_DIGEST_LENGTH * 2 + 1];
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        sprintf(hex_hash + (i * 2), "%02x", hash[i]);
    }
    hex_hash[SHA256_DIGEST_LENGTH * 2] = 0;

    return Py_BuildValue("s", hex_hash);
}

static PyMethodDef PasswordHashMethods[] = {
    {"hash_password", hash_password, METH_VARARGS, "Hash a password using SHA-256."},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef passwordhashmodule = {
    PyModuleDef_HEAD_INIT,
    "password_hash",   /* name of module */
    NULL, /* module documentation, may be NULL */
    -1,       /* size of per-interpreter state of the module,
                 or -1 if the module keeps state in global variables. */
    PasswordHashMethods
};

PyMODINIT_FUNC PyInit_password_hash(void) {
    return PyModule_Create(&passwordhashmodule);
}
