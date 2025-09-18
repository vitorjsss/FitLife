import { API_CONFIG } from '../config/api';
import { authService } from '../service/authService';

// Configuração global para ignorar erros de certificado SSL
if (API_CONFIG.IGNORE_SSL_ERRORS) {
  // @ts-ignore
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  // Configuração para React Native
  if (typeof window !== 'undefined' && window.XMLHttpRequest) {
    const originalOpen = window.XMLHttpRequest.prototype.open;
    // @ts-ignore
    window.XMLHttpRequest.prototype.open = function (...args) {
      // @ts-ignore
      originalOpen.apply(this, args);
      // @ts-ignore
      this.setDisableSSLVerification?.(true);
    };
  }
}

class ApiClient {
  /**
   * Realiza uma requisição HTTP com autenticação JWT
   * @param url 
   * @param options 
   * @returns 
   */
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders(options.headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const fetchOptions: RequestInit = {
        ...options,
        headers,
        signal: controller.signal,
      };

      // Verifica se estamos enviando um FormData
      const isFormData = options.body instanceof FormData;

      if (API_CONFIG.IGNORE_SSL_ERRORS) {
        // Configuração para ignorar erros SSL
        // Não podemos usar rejectUnauthorized diretamente em RequestInit
        (fetchOptions as any).rejectUnauthorized = false;
        const headersObj = new Headers(fetchOptions.headers as Headers);
        headersObj.set('Accept', 'application/json');

        // Não define Content-Type para FormData, deixa o navegador definir automaticamente
        if (!isFormData) {
          headersObj.set('Content-Type', 'application/json');
        }

        // Garantir que o token de autorização seja mantido
        const authToken = await authService.getAccessToken();
        if (authToken) {
          headersObj.set('Authorization', `Bearer ${authToken}`);
        }

        fetchOptions.headers = headersObj;
      }

      console.log(`Iniciando requisição para: ${url}`);
      console.log('Opções da requisição:', JSON.stringify(fetchOptions, null, 2));

      const response = await fetch(url, fetchOptions);

      console.log(`Resposta recebida - Status: ${response.status}`);
      console.log('Headers da resposta:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));

      // Clonar a resposta para poder ler o corpo e ainda processá-lo depois
      const responseClone = response.clone();
      try {
        const responseText = await responseClone.text();
        console.log('Corpo da resposta:', responseText);
      } catch (readError) {
        console.log('Não foi possível ler o corpo da resposta:', readError);
      }

      // Se a resposta for 401, faz logout e retorna erro
      if (response.status === 401) {
        console.log('Acesso não autorizado. Realizando logout automático.');
        await authService.logout();
        throw new Error('Sessão expirada ou acesso não autorizado. Por favor, faça login novamente.');
      }

      // Verifique se o status é 204 (No Content)
      if (response.status === 204) {
        console.log('Resposta 204 recebida. Retornando null.');
        return null as unknown as T; // Retorna null para respostas 204
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Erro na requisição(${response.status}): ${errorText}`);

        const httpError = new Error(`Erro na requisição: ${response.status} - ${errorText}`);
        (httpError as any).statusCode = response.status;
        (httpError as any).statusText = response.statusText;
        (httpError as any).responseBody = errorText;
        (httpError as any).url = url;
        (httpError as any).headers = Object.fromEntries([...response.headers.entries()]);

        console.error('Detalhes completos do erro HTTP:', {
          código: response.status,
          texto: response.statusText,
          url: url,
          corpo: errorText,
          headers: Object.fromEntries([...response.headers.entries()]),
        });

        throw httpError;
      }

      try {
        const jsonData = await response.json();
        console.log('Resposta JSON processada com sucesso:', JSON.stringify(jsonData, null, 2));
        return jsonData;
      } catch (jsonError) {
        console.error('Erro ao processar JSON da resposta:', jsonError);
        const errorMessage = jsonError instanceof Error ? jsonError.message : 'Erro desconhecido';
        throw new Error(`Erro ao processar resposta: ${errorMessage}`);
      }
      //isso aqui é um objeto erro para entender o pq o envio para o back ta estranho em lembretes.
    } catch (error) {
      console.error('Erro na requisição:', error);
      const errorObj = error as any;

      let errorInfo: {
        tipo: string;
        código: string;
        mensagem: string;
        url: string;
        detalhes?: any;
        headers?: any;
        corpo?: any;
      } = {
        tipo: 'Desconhecido',
        código: 'N/A',
        mensagem: errorObj?.message || 'Erro desconhecido',
        url: url,
      };

      if (errorObj?.name === 'TypeError' && errorObj?.message === 'Network request failed') {
        errorInfo.tipo = 'Falha de Rede';
        errorInfo.detalhes = {
          url,
          sslIgnored: API_CONFIG.IGNORE_SSL_ERRORS,
          timeout: API_CONFIG.TIMEOUT,
        };
        console.error('Detalhes do erro de rede:', errorInfo.detalhes);
      } else if (errorObj?.name === 'AbortError') {
        // Removida a verificação de instanceof DOMException que estava causando o erro
        errorInfo.tipo = 'Timeout';
        errorInfo.mensagem = `A requisição excedeu o limite de ${API_CONFIG.TIMEOUT} ms`;
      } else if (errorObj?.response) {
        errorInfo.tipo = 'HTTP';
        errorInfo.código = errorObj.response.status;
        errorInfo.headers = errorObj.response.headers;
        try {
          errorInfo.corpo = errorObj.response.data;
        } catch (e) {
          errorInfo.corpo = 'Não foi possível ler o corpo da resposta';
        }
      }

      console.error('Informações detalhadas do erro:', JSON.stringify(errorInfo, null, 2));

      const enhancedError = new Error(`[${errorInfo.tipo}${errorInfo.código !== 'N/A' ? ' ' + errorInfo.código : ''}] ${errorInfo.mensagem}`);
      (enhancedError as any).details = errorInfo;

      throw enhancedError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Adiciona o token de acesso ao cabeçalho Authorization
   * @param existingHeaders Cabeçalhos existentes
   * @returns Cabeçalhos com o token de acesso
   */
  private async getAuthHeaders(existingHeaders: HeadersInit = {}): Promise<HeadersInit> {
    const token = await authService.getAccessToken();
    const headers = new Headers(existingHeaders as Headers);

    // Verifica se já existe um Content-Type definido (caso de FormData)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    headers.set('Accept', '/');
    headers.set('User-Agent', 'signore-mobile/1.0');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Realiza uma requisição GET
   * @param endpoint Endpoint da API
   * @param options Opções da requisição
   * @returns Resposta da requisição
   */
  async get<T>(apiEndpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${apiEndpoint}`;
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Realiza uma requisição POST
   * @param endpoint 
   * @param data 
   * @param options 
   * @returns 
   */
  async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Realiza uma requisição PUT
   * @param endpoint 
   * @param data 
   * @param options 
   * @returns 
   */
  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Realiza uma requisição PATCH
   * @param endpoint 
   * @param data 
   * @param options 
   * @returns 
   */
  async patch<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    // Verifica se o data é um FormData para não aplicar JSON.stringify
    const body = data instanceof FormData ? data : JSON.stringify(data);

    // Se for FormData, não definimos o Content-Type para que o navegador defina automaticamente com o boundary correto
    if (data instanceof FormData && options.headers) {
      const headers = new Headers(options.headers as Headers);
      // Removemos o Content-Type para que o navegador defina automaticamente
      if (headers.has('Content-Type')) {
        headers.delete('Content-Type');
      }
      options.headers = headers;
    }

    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body,
    });
  }

  /**
   * Realiza uma requisição DELETE
   * @param endpoint 
   * @param options 
   * @returns
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Exporta uma instância única do cliente HTTP
export const apiClient = new ApiClient();