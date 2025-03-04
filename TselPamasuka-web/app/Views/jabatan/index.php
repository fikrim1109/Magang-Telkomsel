<?= $this->extend('layouts/main'); ?>

<?= $this->section('content'); ?>
<div class="my-3 p-3 bg-body rounded shadow-sm">
    <div class="d-flex justify-content-between border-bottom py-2">
        <h3 class="pb-2 mb-0">Data Jabatan</h3>
        <a href="/jabatan/create" class="btn btn-dark">Tambah data</a> 
    </div>
    <div class="pt-3">
        <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Jabatan</th>
                    <th>Deskripsi Jabatan</th>
                    <th>Aksi</th>
                </tr>
            </thead>  
            <tbody>
                <?php $no = 1; ?>
                <?php foreach ($jabatan as $key => $row) : ?>
                    <tr>
                        <td><?= $no++; ?></td>
                        <td><?= $row->nama_jabatan; ?></td>
                        <td><?= $row->deskripsi_jabatan; ?></td>
                        <td>
                            <form action="/jabatan/delete/<?= $row->id; ?>" method="post">
                                <a href="/jabatan/edit/<?= $row->id; ?>" class="btn btn-warning">Edit</a>
                                <?= csrf_field(); ?>
                                <button type="submit" class="btn btn-danger">Hapus</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?> 
            </tbody>
        </table>
    </div>
</div>
<?= $this->endSection(); ?>
