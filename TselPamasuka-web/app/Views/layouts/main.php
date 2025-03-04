<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRUD Pegawai</title>

    <!-- Bootstrap CSS -->
    <!-- Alternatif CDN jika file lokal tidak terbaca -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="/public/assets/css/bootstrap.min.css">
    <style>
      html, body {
        height: 100%;
      }

      body {
        display: flex;
        flex-direction: column;
      }
    </style>
</head>

<body class="bg-body-tertiary">
<?= $this->include('layouts/navbar'); ?>

<div class="container py-5">
    <?= $this->renderSection('content'); ?>
</div>

<footer class="footer mt-auto py-3 bg-secondary">
  <div class="container text-center">
    <span class="text-white">© <?= date("Y"); ?> TselPamasuka</span>
  </div>
</footer>

<!-- Bootstrap JS -->
<!-- Alternatif CDN jika file lokal tidak terbaca -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="/public/assets/js/bootstrap.bundle.min.js"></script>

</body>
</html>