1. Visão Geral do Painel (Next.js + React)
O painel deve ser uma Single Page Application (ou utilizar o App Router do Next.js) focada em produtividade. O administrador precisa de formulários ágeis, upload de mídia confiável e feedback visual claro sobre o que está ativo no app.

Recomendações Técnicas Base:

Uploads: Utilizar os Buckets do Supabase Storage para salvar imagens e vídeos, salvando apenas a publicUrl no banco de dados.

Formulários: Utilizar bibliotecas como react-hook-form e zod para garantir que o administrador preencha os links e datas corretamente antes de enviar para o Supabase.

2. Módulo de Gerenciamento de Canais (Stories)
Como os stories dependem de "Canais" (o perfil que publica o story), o painel precisa de uma tela para geri-los.

Listagem de Canais (Data Table):

Exibir foto do canal, nome e a quantidade de stories ativos no momento.

Controle de Destaque (Toggle/Switch):

Deve haver um botão de ativação rápida (switch) diretamente na tabela para alterar a propriedade is_destaque (true/false). Isso atende à Regra 1 do app. Ao ativar, o painel faz um update direto na tabela do Supabase.

3. Módulo de Publicação de Stories
Esta é a interface principal onde o administrador fará o upload e configurará o comportamento dos stories.

Requisitos da Tela de Cadastro/Edição:

Upload de Mídia (Drag & Drop):

Área para envio de arquivo.

Validação: Aceitar apenas formatos de imagem (JPG, PNG) e vídeo (MP4).

Atenção: Como o app usa o áudio nativo do vídeo, o painel não precisa de campos para upload de áudio separado.

Configuração de Redirecionamento (Ações de Link):

Tipo de Link (Select/Dropdown): Opções: Nenhum, WhatsApp, Link Externo, Link Interno (App).

Destino do Link (Input de Texto): Campo dinâmico que muda conforme o tipo escolhido:

Se WhatsApp: Exibir máscara para número de telefone.

Se Externo: Validar se é uma URL válida (http/https).

Se Interno: Campo para digitar o ID da rota ou selecionar o perfil destino em um combo box.

Controle de Validade (Data de Expiração):

Componente de calendário (Date Picker) obrigatório.

O painel deve salvar essa data no Supabase como data_expiracao. Não é necessário definir horário, o app já assume que expira às 23:59:59 do dia selecionado.

Status de Visualização (Badge):

Na listagem de stories criados, o React deve calcular no front-end: se a data_expiracao for menor que o dia de hoje, exibir uma tag visual cinza ou vermelha indicando "Expirado". Caso contrário, exibir verde "Ativo".

4. Módulo de Gerenciamento de Banners (Carrossel)
A interface de banners será muito similar à de stories, mas com regras visuais e de limite diferentes.

Requisitos da Tela de Cadastro/Edição:

Upload de Mídia Restrito (Crop/Validação):

Como os banners exigem um formato retangular (ex: 16:9), o ideal é que o componente de upload em React possua um limitador de proporção ou avise o usuário caso a imagem subida fuja das medidas do layout do app.

Configuração de Links:

Exatamente o mesmo componente reutilizável criado para os stories (Select de Tipo + Input de Destino).

Data de Expiração:

Mesmo componente de Date Picker usado nos stories.

Requisitos da Listagem de Banners:

Indicador de Limite (Top 5):

Como o aplicativo exibe no máximo 5 banners ativos, o painel deve buscar os banners no Supabase ordenados pelos mais recentes e destacar visualmente quais são os 5 que estão efetivamente aparecendo no app naquele momento.

Sugestão de UI: Uma seção no topo da página chamada "Banners em Exibição (Máx 5)", e abaixo uma lista com o "Histórico de Banners / Banners Expirados".