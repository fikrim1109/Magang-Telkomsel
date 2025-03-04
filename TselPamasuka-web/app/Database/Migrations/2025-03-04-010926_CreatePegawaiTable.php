<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePegawaiTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'nama_pegawai' => [
                'type'       => 'VARCHAR',
                'constraint' => 100, // Tanpa tanda kutip
            ],
            'jabatan_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true, // Menambahkan tanda kutip
            ],
            'alamat' => [
                'type'       => 'VARCHAR',
                'constraint' => 100, // Mengganti 'constrains' menjadi 'constraint'
            ],
            'telepon' => [
                'type'       => 'VARCHAR',
                'constraint' => 20, // Mengganti 'constrains' menjadi 'constraint'
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('jabatan_id', 'jabatan', 'id', 'CASCADE', 'RESTRICT');
        $this->forge->createTable('pegawai');
    }

    public function down()
    {
        $this->forge->dropTable('pegawai');
    }
}
