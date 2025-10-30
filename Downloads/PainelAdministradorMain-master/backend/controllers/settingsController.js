// Ficheiro: backend/controllers/settingsController.js
// Descrição: Lida com a lógica de GESTÃO de configurações do sistema.

const pool = require('../connection');
const path = require('path');
const fs = require('fs'); // Para lidar com caminhos de ficheiro e remoção

// --- FASE 2.3: Configurações Gerais ---

/**
 * Obtém as configurações gerais (Nome, Logo, Cor)
 */
const getGeneralSettings = async (req, res) => {
    console.log("getGeneralSettings: Buscando configurações...");
    try {
        const settings = await pool.query(
            'SELECT company_name, logo_url, primary_color FROM system_settings WHERE id = 1'
        );

        if (settings.rows.length === 0) {
            console.warn("getGeneralSettings: Nenhuma configuração encontrada (ID 1 não existe?).");
            // Isso não deve acontecer se a Etapa 1 (database_setup.sql) foi executada
            return res.status(404).json({ message: "Configurações do sistema não encontradas." });
        }
        console.log("getGeneralSettings: Configurações encontradas:", settings.rows[0]);
        res.json(settings.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar configurações gerais:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar configurações.' });
    }
};

/**
 * Atualiza as configurações gerais (Nome, Cor, Logo)
 * Espera 'multipart/form-data'
 */
const updateGeneralSettings = async (req, res) => {
    console.log("updateGeneralSettings: Iniciando atualização...");
    // Dados do formulário (multipart/form-data)
    const { companyName, primaryColor } = req.body;
    console.log("updateGeneralSettings: Dados recebidos (body):", { companyName, primaryColor });
    // Dados do ficheiro (do logoUploadMiddleware)
    const newLogoFile = req.file;
    console.log("updateGeneralSettings: Ficheiro recebido (req.file):", newLogoFile ? newLogoFile.filename : "Nenhum");


    try {
        // --- Prepara a Query de Atualização ---
        const params = [];
        const fields = [];
        let queryIndex = 1;
        let logoUrlForDB = null; // Variável para guardar o URL do logo para o DB

        // Adiciona os campos de texto à query, se fornecidos
        if (companyName !== undefined) { // Permite string vazia
            fields.push(`company_name = $${queryIndex++}`);
            params.push(companyName);
        }
        if (primaryColor) {
            // TODO: Adicionar validação se a cor é um formato válido (ex: #RRGGBB)
            fields.push(`primary_color = $${queryIndex++}`);
            params.push(primaryColor);
        }

        // --- Lógica do Logo ---
        // Se um NOVO ficheiro foi enviado com sucesso pelo middleware
        if (newLogoFile) {
            // O middleware salva em 'public/uploads/logos/company_logo.ext'
            // O URL que o frontend precisa é '/uploads/logos/company_logo.ext'

            // Converte o caminho completo do ficheiro salvo (newLogoFile.path)
            // para um caminho relativo à pasta 'public'
            const relativePath = path.relative('public', newLogoFile.path);
            // Garante que o URL use barras '/' e comece com '/'
            logoUrlForDB = '/' + relativePath.replace(/\\/g, '/');
            console.log(`updateGeneralSettings: Novo logo URL para DB: ${logoUrlForDB}`);

            fields.push(`logo_url = $${queryIndex++}`);
            params.push(logoUrlForDB);

            // TODO (Opcional): Poderia apagar o logo antigo se a extensão mudou?
            // Isso exigiria buscar o logo_url antigo antes do UPDATE.
        }
        // NOTA: Não há opção de "remover" o logo nesta lógica, apenas substituir.
        // Para remover, precisaríamos de um campo extra no form (ex: removeLogo=true)
        // e definir logo_url = NULL no UPDATE.

        // --- Executa a Atualização ---
        // Só executa se houver campos para atualizar
        if (fields.length > 0) {
            const updateQuery = `UPDATE system_settings SET ${fields.join(', ')} WHERE id = 1 RETURNING *`;
            console.log("updateGeneralSettings: Executando query:", updateQuery, "com params:", params);
            const updatedSettings = await pool.query(updateQuery, params);

            // Verifica se a atualização foi bem-sucedida
            if (updatedSettings.rows.length === 0) {
                console.error("updateGeneralSettings: Falha ao atualizar, linha ID 1 não encontrada?");
                 // Isso seria muito estranho se a tabela foi criada corretamente
                 throw new Error("Falha ao encontrar o registo de configurações para atualizar.");
            }

            console.log("updateGeneralSettings: Configurações atualizadas no DB:", updatedSettings.rows[0]);
            res.status(200).json({
                message: "Configurações gerais atualizadas com sucesso!",
                settings: updatedSettings.rows[0] // Retorna as configurações atualizadas
            });

        } else {
            console.log("updateGeneralSettings: Nenhum campo fornecido para atualização.");
            // Nenhum campo foi alterado, retorna sucesso mas sem mudança
            res.status(200).json({
                 message: "Nenhuma alteração detectada nas configurações gerais.",
                 // Poderia buscar e retornar as configurações atuais aqui se necessário
            });
        }

    } catch (error) {
        console.error('Erro ao atualizar configurações gerais:', error);
        // Devolve o erro para o frontend
        res.status(500).json({ message: error.message || 'Erro interno do servidor ao atualizar configurações.' });
    }
};


// --- FASE 2.4: Configurações do Portal Hotspot ---
// (Já incluídas aqui para eficiência, pois usam a mesma tabela)

/**
 * Obtém as configurações do Hotspot (Timeout, Whitelist)
 */
const getHotspotSettings = async (req, res) => {
    console.log("getHotspotSettings: Buscando configurações...");
    try {
        const settings = await pool.query(
            'SELECT session_timeout_minutes, domain_whitelist FROM system_settings WHERE id = 1'
        );

        if (settings.rows.length === 0) {
             console.warn("getHotspotSettings: Nenhuma configuração encontrada (ID 1 não existe?).");
            return res.status(404).json({ message: "Configurações do hotspot não encontradas." });
        }
        console.log("getHotspotSettings: Configurações encontradas:", settings.rows[0]);
        res.json(settings.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar configs do hotspot:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar configs do hotspot.' });
    }
};

/**
 * Atualiza as configurações do Hotspot (Timeout, Whitelist)
 * Espera 'application/json'
 */
const updateHotspotSettings = async (req, res) => {
     console.log("updateHotspotSettings: Iniciando atualização...");
     console.log("updateHotspotSettings: Dados recebidos (body):", req.body);
    // Estes dados vêm de um JSON (application/json)
    const { sessionTimeoutMinutes, domainWhitelist } = req.body;

    // --- Validação Robusta ---
    if (domainWhitelist === undefined || sessionTimeoutMinutes === undefined) {
         console.warn("updateHotspotSettings: Dados inválidos - faltam campos.");
         return res.status(400).json({ message: 'Dados inválidos. Timeout e Whitelist (mesmo vazia []) são obrigatórios.' });
    }
    // Whitelist DEVE ser um array
    if (!Array.isArray(domainWhitelist)) {
         console.warn("updateHotspotSettings: Whitelist não é um array.");
        return res.status(400).json({ message: 'Whitelist deve ser um array (lista) de domínios.' });
    }
    // Timeout deve ser um número positivo (ou null/0 para desativar, se aplicável - aqui exigimos > 0)
    const timeoutNum = parseInt(sessionTimeoutMinutes, 10);
    if (isNaN(timeoutNum) || timeoutNum <= 0) {
         console.warn("updateHotspotSettings: Timeout inválido:", sessionTimeoutMinutes);
        return res.status(400).json({ message: 'O tempo de sessão deve ser um número inteiro positivo (maior que zero).' });
    }
    // Validação extra: Limpar e validar cada domínio na whitelist (opcional, mas bom)
    const cleanedWhitelist = domainWhitelist
        .map(domain => domain.trim().toLowerCase()) // Limpa e padroniza
        .filter(domain => domain.length > 0 && domain.includes('.')); // Filtra vazios ou inválidos
        // TODO: Poderia adicionar validação de formato de domínio mais estrita aqui (regex)
    console.log("updateHotspotSettings: Whitelist após limpeza:", cleanedWhitelist);

    // --- Executa a Atualização ---
    try {
        const query = `
            UPDATE system_settings
            SET session_timeout_minutes = $1, domain_whitelist = $2
            WHERE id = 1
            RETURNING session_timeout_minutes, domain_whitelist
        `;
         console.log("updateHotspotSettings: Executando query:", query, "com params:", [timeoutNum, cleanedWhitelist]);
        const updatedSettings = await pool.query(query, [timeoutNum, cleanedWhitelist]);

        if (updatedSettings.rows.length === 0) {
             console.error("updateHotspotSettings: Falha ao atualizar, linha ID 1 não encontrada?");
             throw new Error("Falha ao encontrar o registo de configurações para atualizar.");
        }

        console.log("updateHotspotSettings: Configs do Hotspot atualizadas no DB:", updatedSettings.rows[0]);
        res.status(200).json({
            message: "Configurações do Hotspot atualizadas com sucesso!",
            settings: updatedSettings.rows[0] // Retorna os dados atualizados
        });
    } catch (error) {
        console.error('Erro ao atualizar configs do hotspot:', error);
        res.status(500).json({ message: error.message || 'Erro interno do servidor ao atualizar configs do hotspot.' });
    }
};

// Exporta todas as funções do controller
module.exports = {
    getGeneralSettings,
    updateGeneralSettings,
    getHotspotSettings,
    updateHotspotSettings
};

