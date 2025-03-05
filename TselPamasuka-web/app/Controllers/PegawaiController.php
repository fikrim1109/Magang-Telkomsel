<?php

namespace App\Controllers;

use App\Controllers\BaseController;

class PegawaiController extends BaseController
{
    protected $modelPegawai;

    public function __construct()
    {
        $this->modelPegawai = new \App\Models\PegawaiModel();
    }

    public function index()
    {
        $data['pegawai'] = $this->modelPegawai->getPegawaiWithJabatan();
        return view('pegawai/index', $data);
    }

    public function show($id)
    {
        // Implementasi jika diperlukan
    }

    public function create()
    {
        $modelJabatan = new \App\Models\JabatanModel();
        $data['jabatan'] = $modelJabatan->findAll();
        return view('pegawai/create', $data);
    }

    public function store()
    {
        $data = [
            'nama_pegawai' => $this->request->getPost('nama_pegawai'),
            'alamat'       => $this->request->getPost('alamat'),
            'telepon'      => $this->request->getPost('telepon'),
            'jabatan_id'   => $this->request->getPost('jabatan_id')
        ];

        // Simpan data ke database
        $this->modelPegawai->save($data);

        // Kirim notifikasi ke bot Telegram melalui endpoint Node.js
        $message = "Pegawai baru ditambahkan: " . $data['nama_pegawai'];
        $client  = \Config\Services::curlrequest();
        $client->post('http://localhost:3000/notify', [
            'form_params' => ['message' => $message]
        ]);

        return redirect()->to('/pegawai');
    }

    public function edit($id)
    {
        $modelJabatan = new \App\Models\JabatanModel();
        $data['jabatan'] = $modelJabatan->findAll();
        $data['pegawai'] = $this->modelPegawai->find($id);
        return view('pegawai/edit', $data);
    }

    public function update($id)
    {
        $data = [
            'id'           => $id,
            'nama_pegawai' => $this->request->getPost('nama_pegawai'),
            'alamat'       => $this->request->getPost('alamat'),
            'telepon'      => $this->request->getPost('telepon'),
            'jabatan_id'   => $this->request->getPost('jabatan_id')
        ];

        // Update data di database
        $this->modelPegawai->save($data);

        // Kirim notifikasi update
        $message = "Pegawai diupdate: " . $data['nama_pegawai'];
        $client  = \Config\Services::curlrequest();
        $client->post('http://localhost:3000/notify', [
            'form_params' => ['message' => $message]
        ]);

        return redirect()->to('/pegawai');
    }

    public function delete($id)
    {
        // Ambil data terlebih dahulu untuk notifikasi (opsional)
        $pegawai = $this->modelPegawai->find($id);
        $this->modelPegawai->delete($id);
    
        // Kirim notifikasi hapus (opsional)
        $message = "Pegawai dihapus: " . $pegawai->nama_pegawai;
        $client  = \Config\Services::curlrequest();
        $client->post('http://localhost:3000/notify', [
            'form_params' => ['message' => $message]
        ]);
    
        return redirect()->to('/pegawai');
    }
    
}
