<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        getData();
        break;
    case 'POST':
        saveData($input);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getData() {
    global $pdo;
    
    try {
        $hermanos = $pdo->query("SELECT * FROM hermanos")->fetchAll(PDO::FETCH_ASSOC);
        $familias = $pdo->query("SELECT * FROM familias")->fetchAll(PDO::FETCH_ASSOC);
        $grupos = $pdo->query("SELECT * FROM grupos")->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir grupos JSON
        foreach($grupos as &$grupo) {
            $grupo['hermanos'] = json_decode($grupo['hermanos'], true) ?: [];
        }
        
        echo json_encode([
            'hermanos' => $hermanos,
            'familias' => $familias,
            'grupos' => $grupos
        ]);
    } catch(PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function saveData($data) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Limpiar tablas
        $pdo->exec("DELETE FROM hermanos");
        $pdo->exec("DELETE FROM familias");
        $pdo->exec("DELETE FROM grupos");
        
        // Insertar hermanos
        if (!empty($data['hermanos'])) {
            $stmt = $pdo->prepare("INSERT INTO hermanos (id, name, localidad, grupo_id) VALUES (?, ?, ?, ?)");
            foreach($data['hermanos'] as $hermano) {
                $stmt->execute([
                    $hermano['id'],
                    $hermano['name'],
                    $hermano['localidad'] ?? null,
                    $hermano['grupoId'] ?? null
                ]);
            }
        }
        
        // Insertar familias
        if (!empty($data['familias'])) {
            $stmt = $pdo->prepare("INSERT INTO familias (id, name, localidad, hermano_id) VALUES (?, ?, ?, ?)");
            foreach($data['familias'] as $familia) {
                $stmt->execute([
                    $familia['id'],
                    $familia['name'],
                    $familia['localidad'] ?? null,
                    $familia['hermanoId'] ?? null
                ]);
            }
        }
        
        // Insertar grupos
        if (!empty($data['grupos'])) {
            $stmt = $pdo->prepare("INSERT INTO grupos (id, hermanos) VALUES (?, ?)");
            foreach($data['grupos'] as $grupo) {
                $stmt->execute([
                    $grupo['id'],
                    json_encode($grupo['hermanos'])
                ]);
            }
        }
        
        $pdo->commit();
        echo json_encode(['success' => true]);
        
    } catch(PDOException $e) {
        $pdo->rollback();
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>