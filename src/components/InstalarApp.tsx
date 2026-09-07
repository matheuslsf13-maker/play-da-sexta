import { useEffect, useState } from 'react'
import { Modal } from './ui'
import { CHAVE } from '../lib/chaves'

/**
 * INSTALAR O APP NA TELA DE INICIO
 *
 * Android e computador (Chrome/Edge) avisam que o app da para instalar pelo
 * evento `beforeinstallprompt`. Segurando esse evento, o botao abre a caixa de
 * instalacao do proprio sistema -- um toque e acabou.
 *
 * O iPhone NAO tem esse evento: a Apple nao expoe nenhuma forma de o site pedir
 * a instalacao. La so existe o caminho manual, pelo botao de compartilhar do
 * Safari. Entao no iPhone o botao abre o passo a passo em vez de instalar.
 *
 * Nos dois casos o botao some depois de instalado, e quem nao quiser pode
 * dispensar -- a escolha fica guardada neste aparelho.
 */

type EventoDeInstalacao = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** O app ja esta aberto como aplicativo, e nao dentro do navegador? */
function jaInstalado(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone === true
}

function ehIPhone(): boolean {
  if (typeof navigator === 'undefined') return false
  // o iPad moderno se apresenta como Mac; o que o entrega e a tela de toque
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

export function BotaoInstalar() {
  const [evento, setEvento] = useState<EventoDeInstalacao | null>(null)
  const [instalado, setInstalado] = useState(jaInstalado)
  const [passoAPasso, setPassoAPasso] = useState(false)
  const [dispensado, setDispensado] = useState(() => {
    try {
      return localStorage.getItem(CHAVE.instalarDispensado) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const aoPoder = (e: Event) => {
      // sem o preventDefault o Chrome mostra a barra dele e o evento se perde
      e.preventDefault()
      setEvento(e as EventoDeInstalacao)
    }
    const aoInstalar = () => {
      setInstalado(true)
      setEvento(null)
    }
    window.addEventListener('beforeinstallprompt', aoPoder)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoPoder)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  if (instalado || dispensado) return null

  const iphone = ehIPhone()

  async function instalar() {
    if (!evento) {
      setPassoAPasso(true)
      return
    }
    await evento.prompt()
    const { outcome } = await evento.userChoice
    // o evento so serve uma vez; se recusou, o botao passa a ensinar na mao
    setEvento(null)
    if (outcome === 'accepted') setInstalado(true)
  }

  function dispensar() {
    setDispensado(true)
    try {
      localStorage.setItem(CHAVE.instalarDispensado, '1')
    } catch {
      /* navegador sem armazenamento: some so nesta sessao */
    }
  }

  return (
    <>
      <div className="card instalar-app">
        <span className="prox-selo">📲</span>
        <span className="grow" style={{ minWidth: 0 }}>
          <span className="prox-titulo">Fica melhor instalado</span>
          <span className="prox-info">Colocar o Play na tela de início</span>
          <span className="prox-acao">
            {iphone
              ? 'abre em tela cheia, sem a barra do navegador'
              : 'abre em tela cheia e funciona até sem internet'}
          </span>
        </span>
        <span className="col-acoes">
          <button className="prox-abrir" onClick={() => void instalar()}>
            {evento ? 'Instalar' : 'Como faz'}
          </button>
          <button className="linkish tiny" onClick={dispensar}>
            agora não
          </button>
        </span>
      </div>

      {passoAPasso && (
        <Modal
          title={iphone ? 'Instalar no iPhone' : 'Instalar na tela de início'}
          onClose={() => setPassoAPasso(false)}
        >
          {iphone ? (
            <>
              <p className="small" style={{ marginTop: 0 }}>
                No iPhone o próprio sistema não deixa o site instalar sozinho — tem que ser por
                aqui, e <strong>pelo Safari</strong> (no Chrome a opção não aparece).
              </p>
              <ol className="passos-instalar">
                <li>
                  Toque no botão de compartilhar, o <strong>quadrado com a seta ↑</strong>, embaixo
                  na barra do Safari.
                </li>
                <li>
                  Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.
                </li>
                <li>
                  Toque em <strong>Adicionar</strong>, no canto de cima. Pronto: virou ícone.
                </li>
              </ol>
            </>
          ) : (
            <>
              <p className="small" style={{ marginTop: 0 }}>
                Se o botão de instalar não apareceu, dá para fazer pelo menu do navegador:
              </p>
              <ol className="passos-instalar">
                <li>
                  Toque nos <strong>três pontinhos</strong> (⋮) no canto do navegador.
                </li>
                <li>
                  Escolha <strong>Instalar aplicativo</strong> — em alguns aparelhos aparece como
                  <strong> Adicionar à tela inicial</strong>.
                </li>
                <li>Confirme. O ícone vai para a tela de início como qualquer app.</li>
              </ol>
            </>
          )}
          <p className="tiny muted" style={{ marginBottom: 0 }}>
            Instalado, o app abre em tela cheia e o endereço continua o mesmo — quando eu publicar
            uma novidade, ela chega sozinha, sem precisar baixar de novo.
          </p>
        </Modal>
      )}
    </>
  )
}
