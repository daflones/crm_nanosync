import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal'
import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'
import cors from 'cors';
import { createServer } from 'http';

// Configuração do servidor
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Criar servidor HTTP
const server = createServer(app);

// Criar servidor WebSocket no mesmo servidor HTTP
const wss = new WebSocketServer({ 
  server,
  path: '/whatsapp-web'
});

// Instância do WhatsApp
let whatsappClient = null;
let isClientReady = false;
let connectedClients = new Set();

// Configurar cliente WhatsApp
function initializeWhatsAppClient() {
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      clientId: 'crm-nanosync',
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true, // Voltar para true - roda em background
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run'
      ]
    },
    webVersionCache: {
      type: 'local'
    }
  });

  // Eventos do WhatsApp
  whatsappClient.on('qr', (qr) => {
    console.log('QR Code recebido');
    broadcastToClients({ type: 'qr', qr });
  });

  whatsappClient.on('ready', async () => {
    console.log('WhatsApp Web está pronto!');
    isClientReady = true;
    
    // Aguardar um pouco para garantir que tudo está carregado
    setTimeout(async () => {
      try {
        console.log('Buscando contatos e chats...');
        const contacts = await whatsappClient.getContacts();
        const chats = await whatsappClient.getChats();
        
        console.log(`Encontrados ${contacts.length} contatos e ${chats.length} chats`);
        
        // Formatar e deduplificar contatos
        const formattedContacts = contacts.map(formatContact);
        const uniqueContacts = deduplicateContacts(formattedContacts);
        
        console.log(`Contatos processados: ${contacts.length} -> ${uniqueContacts.length} (após deduplicação)`);
        
        broadcastToClients({ 
          type: 'ready',
          contacts: uniqueContacts,
          chats: chats.map(formatChat)
        });
      } catch (error) {
        console.error('Erro ao buscar dados iniciais:', error);
        // Mesmo com erro, notificar que está pronto
        broadcastToClients({ type: 'ready' });
      }
    }, 3000);
  });

  whatsappClient.on('authenticated', () => {
    console.log('WhatsApp autenticado');
    broadcastToClients({ type: 'authenticated' });
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('Falha na autenticação:', msg);
    broadcastToClients({ type: 'auth_failure', message: msg });
  });

  whatsappClient.on('disconnected', (reason) => {
    console.log('WhatsApp desconectado:', reason);
    isClientReady = false;
    broadcastToClients({ type: 'disconnected', reason });
  });

  // Tratar erros do Puppeteer
  whatsappClient.on('error', (error) => {
    console.error('Erro no WhatsApp Client:', error);
    if (error.message.includes('Execution context was destroyed')) {
      console.log('Contexto destruído, reiniciando cliente...');
      setTimeout(() => {
        initializeWhatsAppClient();
      }, 5000);
    }
  });

  whatsappClient.on('message', async (message) => {
    console.log('Nova mensagem recebida:', message.body);
    
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      
      broadcastToClients({ 
        type: 'message', 
        message: formatMessage(message, chat, contact)
      });
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  });

  whatsappClient.on('message_ack', (message, ack) => {
    console.log('📨 Acknowledgment recebido no servidor:', {
      messageId: message.id._serialized,
      ack: ack,
      body: message.body ? message.body.substring(0, 50) : 'sem body'
    });
    
    broadcastToClients({ 
      type: 'message_ack', 
      id: message.id._serialized,
      ack 
    });
  });

  // Inicializar cliente com delay
  setTimeout(() => {
    whatsappClient.initialize().catch(error => {
      console.error('Erro ao inicializar WhatsApp:', error);
      // Tentar novamente após 10 segundos
      setTimeout(() => {
        console.log('Tentando reinicializar WhatsApp...');
        initializeWhatsAppClient();
      }, 10000);
    });
  }, 2000);
}

// Função para deduplificar contatos
function deduplicateContacts(contacts) {
  const contactMap = new Map();
  
  contacts.forEach(contact => {
    // Usar o número limpo como chave principal
    const key = contact.number || contact.id;
    
    if (!contactMap.has(key)) {
      contactMap.set(key, contact);
    } else {
      // Se já existe, manter o que tem mais informações
      const existing = contactMap.get(key);
      
      // Priorizar contatos com nome real sobre pushname
      const shouldReplace = (
        (!existing.name || existing.name.startsWith('+')) && 
        (contact.name && !contact.name.startsWith('+'))
      ) || (
        existing.name === existing.pushname && 
        contact.verifiedName
      ) || (
        contact.isMyContact && !existing.isMyContact
      );
      
      if (shouldReplace) {
        // Combinar informações dos dois contatos
        contactMap.set(key, {
          ...existing,
          ...contact,
          name: contact.verifiedName || contact.name || existing.name,
          // Manter o melhor número para exibição
          displayNumber: contact.verifiedName ? contact.displayNumber : existing.displayNumber
        });
      }
    }
  });
  
  return Array.from(contactMap.values())
    .filter(contact => !contact.isGroup) // Filtrar grupos da lista de contatos
    .sort((a, b) => {
      // Ordenar: Meus contatos primeiro, depois por nome
      if (a.isMyContact && !b.isMyContact) return -1;
      if (!a.isMyContact && b.isMyContact) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
}

// Formatadores de dados
function formatContact(contact) {
  // Limpar e formatar o número
  const cleanNumber = contact.number ? contact.number.replace(/\D/g, '') : '';
  
  return {
    id: contact.id._serialized,
    name: contact.name || contact.pushname || contact.verifiedName || `+${cleanNumber}` || 'Sem nome',
    number: cleanNumber,
    displayNumber: contact.number, // Número original para exibição
    isMyContact: contact.isMyContact,
    isGroup: contact.isGroup,
    isBlocked: contact.isBlocked,
    profilePicUrl: contact.profilePicUrl,
    // Adicionar campos para melhor identificação
    pushname: contact.pushname,
    verifiedName: contact.verifiedName,
    isWAContact: contact.isWAContact,
    isBusiness: contact.isBusiness
  };
}

function formatChat(chat) {
  // Usar nome básico sem busca assíncrona para evitar erros
  let displayName = chat.name || 'Contato sem nome';
  
  // Para chats individuais, usar informações já disponíveis
  if (!chat.isGroup && chat.id && chat.id.user) {
    // Extrair número do ID para mostrar como fallback
    const phoneNumber = chat.id.user;
    if (phoneNumber && !displayName.includes('Contato sem nome')) {
      displayName = displayName || `+${phoneNumber}`;
    } else if (phoneNumber) {
      displayName = `+${phoneNumber}`;
    }
  }
  
  return {
    id: chat.id._serialized,
    name: displayName,
    isGroup: chat.isGroup || false,
    isReadOnly: chat.isReadOnly || false,
    unreadCount: chat.unreadCount || 0,
    timestamp: chat.timestamp || Date.now(),
    lastMessage: chat.lastMessage ? {
      body: chat.lastMessage.body || '',
      timestamp: chat.lastMessage.timestamp || Date.now(),
      fromMe: chat.lastMessage.fromMe || false,
      type: chat.lastMessage.type || 'chat',
      hasMedia: chat.lastMessage.hasMedia || false
    } : null
  };
}

function formatMessage(message, chat, contact) {
  return {
    id: message.id._serialized,
    body: message.body,
    from: message.from,
    to: message.to,
    fromMe: message.fromMe,
    timestamp: message.timestamp * 1000, // Converter para milliseconds
    type: message.type,
    hasMedia: message.hasMedia,
    ack: message.ack,
    author: message.author || null,
    chatName: chat.name,
    contactName: contact.name || contact.pushname
  };
}

// Broadcast para todos os clientes conectados
function broadcastToClients(data) {
  const message = JSON.stringify(data);
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Configurar WebSocket
wss.on('connection', (ws) => {
  console.log('Cliente conectado ao WebSocket');
  connectedClients.add(ws);

  // Enviar status atual
  if (isClientReady) {
    ws.send(JSON.stringify({ type: 'ready' }));
  }

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleClientMessage(ws, data);
    } catch (error) {
      console.error('Erro ao processar mensagem do cliente:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Erro ao processar comando' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('Cliente desconectado do WebSocket');
    connectedClients.delete(ws);
  });
});

// Lidar com mensagens dos clientes
async function handleClientMessage(ws, data) {
  console.log('Comando recebido:', data.type, data);
  
  switch (data.type) {
    case 'get_status':
      // Enviar status atual
      if (isClientReady && whatsappClient) {
        try {
          // Buscar contatos e chats se estiver pronto
          const contacts = await whatsappClient.getContacts();
          const chats = await whatsappClient.getChats();
          
          // Formatar e deduplificar contatos
          const formattedContacts = contacts.map(formatContact);
          const uniqueContacts = deduplicateContacts(formattedContacts);
          
          console.log(`Status request - Contatos processados: ${contacts.length} -> ${uniqueContacts.length} (após deduplicação)`);
          
          broadcastToClients({ 
            type: 'ready',
            contacts: uniqueContacts,
            chats: chats.map(formatChat)
          });
        } catch (error) {
          console.error('Erro ao buscar dados:', error);
          ws.send(JSON.stringify({ type: 'ready' }));
        }
      } else if (whatsappClient) {
        ws.send(JSON.stringify({ type: 'connecting' }));
      } else {
        ws.send(JSON.stringify({ type: 'disconnected' }));
      }
      break;

    case 'connect':
      try {
        console.log('Solicitação de conexão recebida');
        
        // Se já existe um cliente, destruir primeiro
        if (whatsappClient) {
          console.log('Destruindo cliente existente...');
          try {
            await whatsappClient.destroy();
          } catch (error) {
            console.log('Erro ao destruir cliente existente:', error.message);
          }
          whatsappClient = null;
          isClientReady = false;
        }
        
        // Criar novo cliente
        console.log('Criando novo cliente WhatsApp...');
        initializeWhatsAppClient();
        
      } catch (error) {
        console.error('Erro ao conectar:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Erro ao conectar: ' + error.message 
        }));
      }
      break;

    case 'disconnect':
      if (whatsappClient) {
        try {
          console.log('Desconectando WhatsApp...');
          await whatsappClient.logout();
          await whatsappClient.destroy();
          whatsappClient = null;
          isClientReady = false;
          
          // Notificar todos os clientes sobre a desconexão
          broadcastToClients({ type: 'disconnected', reason: 'USER_LOGOUT' });
          
          console.log('WhatsApp desconectado com sucesso');
        } catch (error) {
          console.error('Erro ao desconectar:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Erro ao desconectar: ' + error.message 
          }));
        }
      }
      break;

    case 'send_message':
      if (whatsappClient && isClientReady) {
        try {
          console.log(`Enviando mensagem para ${data.to}: ${data.message}`);
          
          // Verificar se o número está no formato correto
          let chatId = data.to;
          if (!chatId.includes('@')) {
            // Se não tem @, assumir que é um número e adicionar @c.us
            chatId = chatId.replace(/\D/g, '') + '@c.us';
          }
          
          const sentMessage = await whatsappClient.sendMessage(chatId, data.message);
          console.log('Mensagem enviada com sucesso');
          
          ws.send(JSON.stringify({ 
            type: 'message_sent', 
            success: true,
            messageId: sentMessage.id._serialized
          }));
        } catch (error) {
          console.error('Erro ao enviar mensagem:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Erro ao enviar mensagem: ' + error.message 
          }));
        }
      } else {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'WhatsApp não está conectado' 
        }));
      }
      break;

    case 'get_contacts':
      if (whatsappClient && isClientReady) {
        try {
          const contacts = await whatsappClient.getContacts();
          const formattedContacts = contacts.map(formatContact);
          const uniqueContacts = deduplicateContacts(formattedContacts);
          
          ws.send(JSON.stringify({ 
            type: 'contacts', 
            contacts: uniqueContacts
          }));
        } catch (error) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Erro ao buscar contatos: ' + error.message 
          }));
        }
      }
      break;

    case 'get_chats':
      if (whatsappClient && isClientReady) {
        try {
          const chats = await whatsappClient.getChats();
          const formattedChats = chats.map(formatChat);
          ws.send(JSON.stringify({ 
            type: 'chats', 
            chats: formattedChats
          }));
        } catch (error) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Erro ao buscar conversas: ' + error.message 
          }));
        }
      }
      break;

    case 'get_messages':
      if (whatsappClient && isClientReady) {
        try {
          console.log('Buscando mensagens para chat:', data.chatId);
          
          if (!data.chatId) {
            throw new Error('ChatId não fornecido');
          }
          
          const chat = await whatsappClient.getChatById(data.chatId);
          const messages = await chat.fetchMessages({ limit: 200 }); // Aumentar limite para mais mensagens
          
          // Marcar chat como lido
          try {
            await chat.sendSeen();
            console.log('Chat marcado como lido:', data.chatId);
          } catch (seenError) {
            console.log('Não foi possível marcar como lido:', seenError.message);
          }
          
          console.log(`Encontradas ${messages.length} mensagens`);
          
          const formattedMessages = await Promise.all(messages.map(async (msg) => {
            try {
              const baseMessage = {
                id: msg.id?._serialized || `msg_${Date.now()}_${Math.random()}`,
                body: msg.body || '',
                from: msg.from || '',
                to: msg.to || '',
                fromMe: msg.fromMe || false,
                timestamp: (msg.timestamp || Date.now() / 1000) * 1000,
                type: msg.type || 'chat',
                hasMedia: msg.hasMedia || false,
                ack: msg.ack || 0,
                author: msg.author || null
              };

              // Se a mensagem tem mídia, tentar obter a URL
              if (msg.hasMedia) {
                try {
                  const media = await msg.downloadMedia();
                  if (media) {
                    // Criar data URL para exibir a mídia
                    const mediaUrl = `data:${media.mimetype};base64,${media.data}`;
                    
                    // Adicionar duração para áudios
                    const mediaData = {
                      ...baseMessage,
                      mediaUrl,
                      filename: media.filename,
                      filesize: media.filesize,
                      mimetype: media.mimetype
                    };
                    
                    // Para mensagens de áudio, incluir duração se disponível
                    if (msg.type === 'ptt' || msg.type === 'audio') {
                      mediaData.duration = msg.duration || 0;
                    }
                    
                    return mediaData;
                  }
                } catch (mediaError) {
                  console.log('Erro ao baixar mídia:', mediaError.message);
                  // Continuar sem a mídia
                }
              }

              return baseMessage;
            } catch (error) {
              console.error('Erro ao formatar mensagem:', error);
              return null;
            }
          }));

          const validMessages = formattedMessages.filter(msg => msg !== null);
          
          ws.send(JSON.stringify({ 
            type: 'chat_messages', 
            chatId: data.chatId,
            messages: validMessages
          }));
          
          // Notificar que o chat foi marcado como lido
          broadcastToClients({
            type: 'chat_read',
            chatId: data.chatId
          });
        } catch (error) {
          console.error('Erro ao buscar mensagens para chat', data.chatId, ':', error.message);
          
          // Se o chat não existe, retornar array vazio em vez de erro
          if (error.message.includes('Chat not found') || error.message.includes('Cannot read properties')) {
            ws.send(JSON.stringify({ 
              type: 'chat_messages', 
              chatId: data.chatId,
              messages: []
            }));
          } else {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Erro ao buscar mensagens: ' + error.message 
            }));
          }
        }
      }
      break;

    case 'send_media':
      if (whatsappClient && isClientReady) {
        try {
          console.log('Enviando mídia para:', data.to);
          console.log('Dados da mídia:', {
            mimetype: data.media.mimetype,
            filename: data.media.filename,
            filesize: data.media.filesize,
            caption: data.media.caption,
            dataLength: data.media.data ? data.media.data.length : 0
          });
          
          // MessageMedia já importado no topo do arquivo
          
          // Validar dados de mídia
          if (!data.media.data || !data.media.mimetype) {
            throw new Error('Dados de mídia inválidos');
          }
          
          // Para áudios WebM, converter mimetype para compatibilidade
          let mimetype = data.media.mimetype;
          if (mimetype.includes('webm')) {
            mimetype = 'audio/ogg; codecs=opus';
          }
          
          // Criar MessageMedia com os dados corretos
          const media = new MessageMedia(
            mimetype,
            data.media.data,
            data.media.filename,
            data.media.filesize
          );
          
          // Enviar mídia primeiro
          const sentMessage = await whatsappClient.sendMessage(data.to, media);
          
          console.log('Mídia enviada com sucesso:', sentMessage.id._serialized);
          
          // Se há legenda, enviar como mensagem de texto separada
          let captionMessageId = null;
          console.log('Verificando legenda:', {
            hasCaption: !!data.media.caption,
            caption: data.media.caption,
            captionTrimmed: data.media.caption ? data.media.caption.trim() : null,
            captionLength: data.media.caption ? data.media.caption.trim().length : 0
          });
          
          if (data.media.caption && data.media.caption.trim()) {
            console.log('Enviando legenda como texto:', data.media.caption.trim());
            try {
              const captionMessage = await whatsappClient.sendMessage(data.to, data.media.caption.trim());
              captionMessageId = captionMessage.id._serialized;
              console.log('Legenda enviada com sucesso:', captionMessageId);
            } catch (captionError) {
              console.error('Erro ao enviar legenda:', captionError);
            }
          } else {
            console.log('Nenhuma legenda para enviar');
          }
          
          // Confirmar envio
          ws.send(JSON.stringify({ 
            type: 'message_sent', 
            messageId: sentMessage.id._serialized,
            captionMessageId: captionMessageId,
            tempId: data.tempId,
            chatId: data.to
          }));
          
        } catch (error) {
          console.error('Erro ao enviar mídia:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Erro ao enviar mídia: ' + error.message 
          }));
        }
      } else {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'WhatsApp não está conectado' 
        }));
      }
      break;

    default:
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Comando não reconhecido' 
      }));
  }
}

// Rotas HTTP para status
app.get('/status', (req, res) => {
  res.json({
    whatsappReady: isClientReady,
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor HTTP
server.listen(PORT, () => {
  console.log(`Servidor HTTP rodando na porta ${PORT}`);
  console.log(`WebSocket rodando em ws://localhost:${PORT}/whatsapp-web`);
  console.log('Servidor WhatsApp Web pronto. Aguardando conexões...');
  
  // NÃO inicializar automaticamente - aguardar comando do frontend
});

// Lidar com sinais de encerramento
process.on('SIGINT', async () => {
  console.log('Encerrando servidor...');
  
  if (whatsappClient && isClientReady) {
    try {
      await whatsappClient.destroy();
    } catch (error) {
      console.error('Erro ao encerrar WhatsApp:', error);
    }
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Encerrando servidor...');
  
  if (whatsappClient && isClientReady) {
    try {
      await whatsappClient.destroy();
    } catch (error) {
      console.error('Erro ao encerrar WhatsApp:', error);
    }
  }
  
  process.exit(0);
});
