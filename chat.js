// DEMONSTRAÇÃO de assistente no site (gerado por propostas/prospeccao-odonto/gerar-chat.py).
// Não usa IA de verdade: responde com textos do próprio site da clínica e monta o agendamento em etapas.
// Na versão contratada, o mesmo painel liga a um assistente real. Reaproveita CLINIC (e, se houver, TEAM/nextDates/slotsFor) de script.js.

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const TREATMENTS = [
  ['Implantes', 'Implantes'], ['Prótese', 'Prótese'], ['Alinhadores', 'Alinhadores'], ['Estética', 'Estética'], ['Harmonização', 'Harmonização'],
  ['Canal', 'Canal'], ['Check-up e limpeza', 'Check-up e limpeza'], ['Ainda não sei', ''],
];

const CFG = {
  title: 'Assistente Conde de Porto Alegre',
  greeting: 'Oi! Sou o assistente virtual da Clínica Conde de Porto Alegre (demonstração). Posso tirar dúvidas sobre convênios e tratamentos e deixar sua avaliação encaminhada. Como posso ajudar?',
  quick: [['Aceitam meu convênio?', 'convenio'], ['O que o convênio cobre?', 'cobertura'], ['Quais especialidades?', 'servicos'], ['Como é a 1ª consulta?', 'primeira'], ['Estou com dor agora', 'urgencia'], ['Onde fica e horários', 'local']],
  faq: [
    { id: 'convenio', words: ['convenio', 'plano', 'amil', 'unimed', 'bradesco', 'metlife', 'odontoprev', 'porto seguro', 'aceitam', 'atendem meu'], text: 'Atendemos mais de 15 convênios, entre eles Amil Dental, Unimed Odonto, Bradesco Saúde, OdontoPrev, MetLife, Porto Seguro Dental, Plena, Assist Card, InterOdonto, LIS Dental, APPAI, GEAP Dental e Capesesp. Se o seu não estiver na lista, fale com a recepção: atendemos outros planos também.' },
    { id: 'cobertura', words: ['cobre', 'cobertura', 'coberto', 'particular'], text: 'Depende do seu plano. Na avaliação a gente mostra o que é coberto e o que, se for o caso, seria particular, antes de qualquer procedimento.' },
    { id: 'servicos', words: ['especialidade', 'trata', 'servico', 'fazem', 'atendem'], text: 'Implantes, prótese, alinhadores e ortodontia, estética (clareamento, lentes e facetas), harmonização com botox, canal, clínico geral e cirurgia (extrações, inclusive de siso).' },
    { id: 'implante', words: ['implante', 'dente perdido', 'perdi dente'], text: 'Com os implantes você repõe dentes perdidos com segurança e volta a mastigar e sorrir sem preocupação.' },
    { id: 'protese', words: ['protese', 'dentadura', 'chapa'], text: 'As próteses, fixas e removíveis, são planejadas para conforto, função e um sorriso natural.' },
    { id: 'orto', words: ['alinhador', 'ortodontia', 'aparelho', 'dentes tortos', 'invisalign'], text: 'Alinhadores transparentes ou aparelho, para crianças e adultos, com acompanhamento em cada fase.' },
    { id: 'estetica', words: ['estetica', 'clareamento', 'clarear', 'lente', 'faceta', 'branquear'], text: 'Fazemos clareamento, lentes e facetas para um sorriso mais claro e harmonioso.' },
    { id: 'harmonizacao', words: ['harmonizacao', 'botox', 'toxina', 'orofacial'], text: 'Fazemos toxina botulínica e harmonização orofacial para equilibrar e suavizar o sorriso.' },
    { id: 'canal', words: ['canal', 'endodontia'], text: 'O tratamento de canal salva o dente e acaba com a dor, com técnica moderna.' },
    { id: 'geral', words: ['limpeza', 'check', 'restauracao', 'siso', 'extracao', 'cirurgia', 'clinico geral', 'tirar dente'], text: 'No clínico geral e cirurgia, fazemos check-up, limpeza, restaurações e extrações, inclusive de siso, com planejamento e segurança.' },
    { id: 'custo', words: ['custa', 'preco', 'valor', 'caro', 'orcamento', 'quanto'], booking: true, text: 'O valor depende de quantos dentes, do tipo de prótese e do planejamento de cada caso, por isso não passo preço pelo chat. A avaliação vem primeiro: você sai sabendo etapas, prazos e valores, sem compromisso.' },
    { id: 'parcelar', words: ['parcel', 'pagamento', 'cartao', 'forma de pagar', 'pagar'], text: 'Sim, dá para parcelar o tratamento particular. As opções de pagamento e parcelamento são apresentadas junto com o plano de tratamento.' },
    { id: 'primeira', words: ['primeira consulta', 'como funciona', 'avaliacao', 'o que acontece', 'radiografia'], text: 'A primeira consulta tem 4 passos: 1) conversa, em que você conta o que incomoda e se vai usar convênio ou particular; 2) avaliação, com exame clínico e radiografias quando indicado; 3) plano claro, com o que o convênio cobre, o que é particular, etapas e valores; 4) você decide, e só começamos quando se sentir seguro.' },
    { id: 'medo', words: ['medo', 'receio', 'ansios', 'nervos'], text: 'Você pode contar isso logo no agendamento. A consulta começa com conversa, cada etapa é explicada antes e você pode pedir pausa a qualquer momento.' },
    { id: 'urgencia', words: ['urgencia', 'emergencia', 'dor forte', 'inchaco', 'inchado', 'quebrou', 'quebrado', 'sangr', 'dor agora', 'doendo', 'dor', 'sos'], cta: { label: 'Ligar agora: (21) 2672-0800', href: 'tel:+552126720800' }, text: 'Sim, atendemos urgência. Em caso de dor, inchaço ou dente quebrado, ligue para a clínica que encaixamos o atendimento o quanto antes.' },
    { id: 'local', words: ['onde', 'endereco', 'fica', 'local', 'chegar', 'rua', 'horario', 'abre', 'fecha', 'aberto', 'funciona', 'sabado', 'telefone', 'whatsapp', 'ligar'], text: () => `Ficamos na Rua Conde de Porto Alegre, 548, em frente à Oi, no 25 de Agosto, Duque de Caxias. Atendemos de segunda a sexta, das 8h às 19h, e aos sábados, das 8h às 12h. ${botStatus()} Telefones (21) 2672-0800 e (21) 2653-2575, WhatsApp (21) 99497-6920.` },
  ],
  steps: [
    { key: 'treatment', ask: 'Vamos deixar sua avaliação encaminhada. Qual especialidade você quer?', options: () => TREATMENTS },
    { key: 'plan', ask: 'O atendimento será particular ou pelo convênio?', options: () => [['Particular', 'Particular'], ['Tenho convênio', 'Convênio']] },
    { key: 'planName', text: true, skip: 'Prefiro dizer depois', when: (d) => d.plan === 'Convênio', ask: 'Qual é o seu convênio? (ex.: Amil Dental)', clean: (t) => t.slice(0, 40) },
    { key: 'day', ask: 'Qual o melhor dia?', options: () => [['O quanto antes', 'O quanto antes'], ['Durante a semana', 'Durante a semana'], ['No sábado', 'No sábado']] },
    { key: 'period', ask: 'E o período?', options: () => [['Manhã', 'manhã'], ['Tarde', 'tarde']] },
    { key: 'name', text: true, ask: 'Qual o seu nome?', clean: (t) => t.split(/\s+/)[0].slice(0, 30) },
  ],
  message: (d) => {
    const lines = [`Olá! Gostaria de agendar uma avaliação na ${CLINIC.name}.`];
    lines.push(d.treatment ? `Interesse: ${d.treatment}.` : 'Ainda não sei qual tratamento.');
    lines.push(`Atendimento ${d.plan === 'Convênio' ? `pelo convênio${d.planName ? ` ${d.planName}` : ''}` : 'particular'}.`);
    lines.push(`Quando: ${d.day}, de ${d.period}.`);
    if (d.name) lines.push(`Nome: ${d.name}.`);
    return lines;
  },
  summary: (d) => `${d.treatment || 'avaliação'}, ${d.plan === 'Convênio' ? `convênio${d.planName ? ` ${d.planName}` : ''}` : 'particular'}, ${d.day}, de ${d.period}`,
};


const botStatus = () => {
  const clock = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[clock.weekday];
  const min = Number(clock.hour) * 60 + Number(clock.minute);
  const today = CLINIC.hours[wd];
  if (today && min >= today[0] && min < today[1]) return 'Estamos abertos agora.';
  return 'No momento estamos fechados, e a recepção responde assim que abrir.';
};

(() => {
  const root = document.createElement('div');
  root.className = 'chat';
  root.innerHTML = `
    <button type="button" class="chat-launcher" aria-label="Abrir assistente virtual" aria-expanded="false" aria-controls="chat-panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>
      <span>Tire suas dúvidas</span>
    </button>
    <section class="chat-panel" id="chat-panel" role="dialog" aria-label="${CFG.title}" hidden>
      <header class="chat-head">
        <div>
          <strong>${CFG.title}</strong>
          <small>Demonstração · respostas baseadas no site da clínica</small>
        </div>
        <button type="button" class="chat-close" aria-label="Fechar">×</button>
      </header>
      <div class="chat-log" role="log" aria-live="polite"></div>
      <div class="chat-quick"></div>
      <form class="chat-form" autocomplete="off">
        <input type="text" class="chat-input" placeholder="Digite sua dúvida..." aria-label="Digite sua dúvida" />
        <button type="submit" class="chat-send" aria-label="Enviar">→</button>
      </form>
      <p class="chat-note">O assistente não dá diagnóstico nem passa preço. A recepção confirma tudo.</p>
    </section>`;
  document.body.append(root);

  const launcher = root.querySelector('.chat-launcher');
  const panel = root.querySelector('.chat-panel');
  const log = root.querySelector('.chat-log');
  const quick = root.querySelector('.chat-quick');
  const form = root.querySelector('.chat-form');
  const input = root.querySelector('.chat-input');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let flow = null;
  let greeted = false;

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const addMsg = (who, text) => {
    const el = document.createElement('p');
    el.className = `chat-msg chat-${who}`;
    el.textContent = text;
    log.append(el);
    scroll();
    return el;
  };
  const addLink = (label, href, external = true) => {
    const a = document.createElement('a');
    a.className = 'chat-cta';
    a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.textContent = label;
    log.append(a);
    scroll();
  };
  const setQuick = (items) => {
    quick.replaceChildren();
    items.forEach(([label, fn]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = label;
      b.addEventListener('click', () => { addMsg('user', label); fn(); });
      quick.append(b);
    });
  };
  const bot = (text, after) => {
    const typing = addMsg('bot', '…');
    typing.classList.add('is-typing');
    setTimeout(() => {
      typing.classList.remove('is-typing');
      typing.textContent = text;
      scroll();
      after?.();
    }, reduce ? 0 : 650);
  };

  const answer = (id) => {
    const item = CFG.faq.find((f) => f.id === id);
    const text = typeof item.text === 'function' ? item.text() : item.text;
    bot(text, () => {
      if (item.cta) addLink(item.cta.label, item.cta.href, !!item.cta.external);
      menu(item.booking);
    });
  };
  const menu = (withBooking) => setQuick([
    ...CFG.quick.map(([label, id]) => [label, () => answer(id)]),
    ['Quero agendar', startFlow],
  ]);

  // Fluxo de agendamento (pré-agendamento: a recepção confirma)
  const cancel = () => { flow = null; bot('Claro! Qual é a sua dúvida?', menu); };
  const startFlow = () => { flow = { i: -1, data: {}, text: null }; nextStep(); };
  const nextStep = () => {
    do { flow.i += 1; } while (flow.i < CFG.steps.length && CFG.steps[flow.i].when && !CFG.steps[flow.i].when(flow.data));
    if (flow.i >= CFG.steps.length) { finish(); return; }
    const step = CFG.steps[flow.i];
    if (step.text) {
      flow.text = step;
      bot(step.ask, () => { setQuick(step.skip ? [[step.skip, () => { flow.text = null; nextStep(); }]] : []); input.focus(); });
      return;
    }
    const opts = step.options(flow.data);
    bot(step.ask, () => setQuick([
      ...opts.map(([label, value]) => [label, () => { flow.data[step.key] = value; nextStep(); }]),
      ['Outra dúvida', cancel],
    ]));
  };
  const finish = () => {
    const d = flow.data;
    const lines = [...CFG.message(d), '(Pedido feito pelo assistente do site)'];
    const summary = CFG.summary(d);
    flow = null;
    bot(`Pronto${d.name ? `, ${d.name}` : ''}! Deixei seu pedido montado: ${summary}. Toque abaixo para enviar à recepção, que confirma a disponibilidade com você.`, () => {
      addLink('Enviar para a recepção no WhatsApp →', `https://api.whatsapp.com/send?phone=${CLINIC.whatsapp}&text=${encodeURIComponent(lines.join('\n'))}`);
      menu();
    });
  };

  const interpret = (text) => {
    const q = norm(text);
    if (/(agendar|marcar|reservar|quero ir)/.test(q) || (/(consulta|avaliacao)/.test(q) && !/(primeira|como funciona)/.test(q))) return 'agendar';
    let best = null; let bestScore = 0;
    CFG.faq.forEach((f) => {
      const score = f.words.reduce((n, w) => n + (q.includes(norm(w)) ? 1 : 0), 0);
      if (score > bestScore) { best = f.id; bestScore = score; }
    });
    return best;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg('user', text);
    if (flow && flow.text) {
      const step = flow.text;
      flow.data[step.key] = step.clean ? step.clean(text) : text;
      flow.text = null;
      nextStep();
      return;
    }
    if (flow) { bot('Para continuar o agendamento, escolha uma das opções acima. Se preferir, toque em "Outra dúvida".'); return; }
    const found = interpret(text);
    if (found === 'agendar') { startFlow(); return; }
    if (found) { answer(found); return; }
    bot('Não tenho essa informação com segurança. Posso deixar seu pedido encaminhado para a recepção, que responde direitinho. Quer agendar uma avaliação?', () => setQuick([['Quero agendar', startFlow], ['Outra dúvida', cancel]]));
  });

  const open = () => {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
    if (!greeted) { greeted = true; addMsg('bot', CFG.greeting); menu(); }
    input.focus();
  };
  const close = () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
    launcher.focus();
  };
  launcher.addEventListener('click', () => (panel.hidden ? open() : close()));
  root.querySelector('.chat-close').addEventListener('click', close);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) close(); });
})();
