<?php

namespace App\Controllers;

use App\Controllers\BaseController;

class JabatanController extends BaseController
{
    protected $modelJabatan;

    public function __construct()
    {
        $this->modelJabatan = new \App\Models\JabatanModel();
    }

    public function index()
    {
        $data['jabatan'] = $this->modelJabatan->findAll();
        return view('jabatan/index', $data);
    }

    public function show($id)
    {
        // Implementasi jika diperlukan
    }

    public function create()
    {
        return view('jabatan/create');
    }

    public function store()
    {
        $data = [
            'nama_jabatan'       => $this->request->getPost('nama_jabatan'),
            'deskripsi_jabatan'  => $this->request->getPost('deskripsi_jabatan')
        ];

        // Simpan data ke database
        $this->modelJabatan->save($data);

        // Kirim notifikasi ke bot Telegram melalui endpoint Node.js
        $message = "Jabatan baru ditambahkan: " . $data['nama_jabatan'];
        $client  = \Config\Services::curlrequest();
        $client->post('http://localhost:3000/notify', [
            'form_params' => ['message' => $message]
        ]);

        return redirect()->to('/jabatan');
    }

    public function edit($id)
    {
        $data['jabatan'] = $this->modelJabatan->find($id);
        return view('jabatan/edit', $data);
    }

    public function update($id)
    {
        $data = [
            'id'                 => $id,
            'nama_jabatan'       => $this->request->getPost('nama_jabatan'),
            'deskripsi_jabatan'  => $this->request->getPost('deskripsi_jabatan')
        ];

        // Update data di database
        $this->modelJabatan->save($data);

        // Kirim notifikasi update
        $message = "Jabatan diupdate: " . $data['nama_jabatan'];
        $client  = \Config\Services::curlrequest();
        $client->post('http://localhost:3000/notify', [
            'form_params' => ['message' => $message]
        ]);

        return redirect()->to('/jabatan');
    }

    public function delete($id)
    {
        // Ambil data terlebih dahulu untuk notifikasi (opsional)
        $jabatan = $this->modelJabatan->find($id);
        $this->modelJabatan->delete($id);
    
        // Kirim notifikasi hapus (opsional)
        // Ubah akses data menjadi notasi object
        $message = "Jabatan dihapus: " . $jabatan->nama_jabatan;
        $client  = \Config\Services::curlrequest();
        $client->post('http://localhost:3000/notify', [
            'form_params' => ['message' => $message]
        ]);
    
        return redirect()->to('/jabatan');
    }
    
}
