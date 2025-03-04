<?= $this->extend('layouts/main'); ?>

<?= $this->section('content'); ?>
<div class="my-3 p-3 bg-body rounded shadow-sm">
    <div class="d-flex justify-content-between border-bottom py-2">
        <h3 class="pb-2 mb-0">Edit Data Pegawai</h3>
        <a href="/Pegawai" class="btn btn-dark">Kembali</a> 
    </div>
    </div>
    <div class="pt-3">
        <form action="/pegawai/update/<?= $pegawai->id; ?>" method="post">
            <?= csrf_field(); ?>
            <div class="mb-3">
                <label for="nama_Pegawai" class="form-label">Nama Pegawai :</label>
                <input type="text" class="form-control" name="nama_pegawai" value="<?= $pegawai->nama_pegawai; ?>" placeholder="Masukkan nama Pegawai" required>
            </div>
            <div class="mb-3">
                <label for="alamat" class="form-label">Alamat Pegawai :</label>
                <input type="text" class="form-control" name="alamat" value="<?= $pegawai->alamat; ?>" placeholder="Masukkan alamat Pegawai" required>
            </div>

            <div class="mb-3">
                <label for="jabatan_id" class="form-label">Jabatan :</label>
                <select name="jabatan_id" class="form-select">
                    <option value="">Pilih Jabatan</option>
                    <?php foreach ($jabatan as $j) : ?>
                        <option value="<?= $j->id; ?>"<?= ($j->id == $pegawai->jabatan_id) ? 'selected' : ''; ?>><?= $j->nama_jabatan; ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="mb-3">
                <label for="telepon" class="form-label">No Telp :</label>
                <input type="text" class="form-control" name="telepon" value="<?= $pegawai->telepon; ?>" placeholder="Masukkan no telp Pegawai" required>
            </div>
            <button type="submit" class="btn btn-primary">Update</button>
        </form>
    </div>
</div>
<?= $this->endSection(); ?>