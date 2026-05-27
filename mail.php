<?php
/**
 * FOT Group — Contact Form Handler
 */

header('Content-Type: application/json; charset=UTF-8');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

// ——— CONFIG ——————————————————————————————————
$config = [
    'to'      => 'contacto@fotgroup.com.ar',  // Cambiar por el email real
    'from'    => 'noreply@fotgroup.com.ar',    // Cambiar por el dominio real
    'subject' => 'Nuevo contacto - FOT Group',
];

// ——— SANITIZE ——————————————————————————————————
function clean(string $value): string {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

// Remove header injection attempts
function sanitize_header(string $value): string {
    return preg_replace('/[\r\n\t]/', '', clean($value));
}

// ——— COLLECT & VALIDATE ——————————————————————
$errors = [];

$nombre    = sanitize_header($_POST['nombre']    ?? '');
$empresa   = sanitize_header($_POST['empresa']   ?? '');
$telefono  = sanitize_header($_POST['telefono']  ?? '');
$email     = sanitize_header($_POST['email']     ?? '');
$consulta  = sanitize_header($_POST['consulta']  ?? '');
$mensaje   = clean($_POST['mensaje']             ?? '');

if (empty($nombre))   $errors[] = 'El nombre es obligatorio.';
if (empty($email))    $errors[] = 'El email es obligatorio.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'El email no es válido.';
if (empty($mensaje))  $errors[] = 'El mensaje es obligatorio.';

$allowed_consultas = [
    'Desarrollo inmobiliario',
    'Inversión',
    'Marketing inmobiliario',
    'Comercialización',
    'Consultoría',
    'Gestión de proyecto',
    'Otro',
];

if (!empty($consulta) && !in_array($consulta, $allowed_consultas)) {
    $consulta = 'Otro';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ——— BUILD EMAIL ——————————————————————————————
$body  = "NUEVO CONTACTO — FOT GROUP\n";
$body .= str_repeat('—', 40) . "\n\n";
$body .= "Nombre:         {$nombre}\n";
$body .= "Empresa:        " . ($empresa ?: '—') . "\n";
$body .= "Teléfono:       " . ($telefono ?: '—') . "\n";
$body .= "Email:          {$email}\n";
$body .= "Tipo de consulta: " . ($consulta ?: '—') . "\n\n";
$body .= "Mensaje:\n{$mensaje}\n\n";
$body .= str_repeat('—', 40) . "\n";
$body .= "Enviado: " . date('d/m/Y H:i:s') . "\n";

$headers  = "From: FOT Group <{$config['from']}>\r\n";
$headers .= "Reply-To: {$nombre} <{$email}>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// ——— SEND ——————————————————————————————————
$sent = mail($config['to'], $config['subject'], $body, $headers);

if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Mensaje enviado correctamente.',
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo enviar el mensaje. Intentá nuevamente o escribinos directamente.',
    ]);
}
