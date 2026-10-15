import { CreateNovenaDto } from './novenas.service';

export const INITIAL_NOVENAS: CreateNovenaDto[] = [
  // 1. Nossa Senhora Desatadora dos Nós
  {
    title: 'Novena a Nossa Senhora Desatadora dos Nós',
    slug: 'nossa-senhora-desatadora-dos-nos',
    subtitle: 'Para desatar os nós e dificuldades insolúveis da vida espiritual, familiar e temporal',
    description:
      'Uma das devoções marianas mais amadas da Igreja Católica, propagada pelo Papa Francisco. Diante da Virgem Maria, nenhum nó permanece atado.',
    category: 'marianas',
    tags: ['maria', 'família', 'causas impossíveis', 'libertação', 'paz'],
    feast_date: '09-28',
    ideal_start_date: '09-19',
    banner_color: '#002D6E',
    is_published: true,
    is_featured: true,
    display_order: 1,
    days: [
      {
        day_number: 1,
        title: '1º Dia: O Nó do Desespero e da Falta de Esperança',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Meu Senhor e meu Deus, peço humildemente perdão por todos os meus pecados. Virgem Mãe de Deus, acolhei o meu clamor neste primeiro dia de novena.',
        scripture_reading:
          'Lucas 1, 37: "Porque para Deus nada é impossível."',
        meditation:
          'Santa Mãe querida, Santíssima Senhora Desatadora dos Nós, venho hoje diante de Vós com o coração ferido pela angústia e pelo desânimo. Quantas vezes me sinto sem saída diante dos problemas que me cercam! Olhai com misericórdia para a minha vida e desatai este nó que me faz perder a paz.',
        daily_prayer:
          'Virgem Maria, Mãe do belo amor, entrego em Vossas mãos maternas a fita da minha vida com todos os nós que o inimigo tentou atar. Mãe admirável, desatai hoje o nó do desespero e da falta de fé em meu coração. Por Jesus Cristo, Nosso Senhor. Amém.',
        intentions_prompt: 'Apresente a Nossa Senhora a causa e o nó principal que você deseja desatar nesta novena.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. Nossa Senhora Desatadora dos Nós, rogai por nós que recorremos a Vós!',
      },
      {
        day_number: 2,
        title: '2º Dia: O Nó do Ressentimento e da Mágoa',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Ato de Contrição: Meu Deus, eu me arrependo de todo o coração de Vos ter ofendido, e proponho firmemente nunca mais pecar.',
        scripture_reading:
          'Colossenses 3, 13: "Suportai-vos uns aos outros e perdoai-vos mutuamente, se um tiver queixa contra o outro."',
        meditation:
          'Mãe Santíssima, a mágoa e o ressentimento são nós apertados que sufocam a nossa alma e nos impedem de amar livremente. Hoje vos peço a graça de libertar meu coração de todo veneno de rancor contra quem me feriu.',
        daily_prayer:
          'Maria, Mãe da Misericórdia, concedei-me a virtude do perdão sincero. Tomai em Vossas mãos o nó da mágoa guardada e, com Vosso toque virginal, desatai-o para sempre. Que em meu peito reine apenas a caridade de Cristo. Amém.',
        intentions_prompt: 'Entregue nas mãos de Maria as pessoas que você tem dificuldade de perdoar.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. Nossa Senhora Desatadora dos Nós, rogai por nós!',
      },
      {
        day_number: 3,
        title: '3º Dia: O Nó das Feridas e Conflitos Familiares',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Vinde, Espírito Santo, enchei os corações dos Vossos fiéis e acendei neles o fogo do Vosso amor.',
        scripture_reading:
          'Josué 24, 15: "Eu e a minha casa serviremos ao Senhor."',
        meditation:
          'Mãe Celeste, Rainha da Família, contemplai os conflitos, distanciamentos e divisões no seio do meu lar. Onde o inimigo semeou desunião, que a Vossa ternura de Mãe plante o diálogo, a concórdia e o perdão.',
        daily_prayer:
          'Virgem Poderosa, coloco sob Vosso manto maternal toda a minha família. Desatai cada nó de discórdia, orgulho e incompreensão que afasta os meus entes queridos de Deus e uns dos outros. Fazei de nossa casa um reflexo do lar de Nazaré. Amém.',
        intentions_prompt: 'Reze nominalmente pelos membros da sua família que mais precisam de união e paz.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. Nossa Senhora Desatadora dos Nós, abençoai as nossas famílias!',
      },
      {
        day_number: 4,
        title: '4º Dia: O Nó das Dívidas e Preocupações Materiais',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Senhor Jesus, em Vós confio todas as minhas necessidades do corpo e da alma.',
        scripture_reading:
          'Filipenses 4, 19: "O meu Deus proverá a todas as vossas necessidades, segundo a sua riqueza, com magnificência em Cristo Jesus."',
        meditation:
          'Maria Santíssima, que junto a São José vivestes a pobreza com dignidade e confiança na Providência Divina, olhai para a minha situação material e financeira. Não permitais que o medo e a escassez tirem a minha honra e minha fidelidade a Deus.',
        daily_prayer:
          'Mãe da Providência, desatai o nó das dívidas, da falta de trabalho digno e da ansiedade pelas coisas terrenas. Abri portas de trabalho e honestidade, e dai-me sabedoria para administrar tudo com retidão cristã. Amém.',
        intentions_prompt: 'Apresente suas preocupações de trabalho, finanças e sustento familiar.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. Nossa Senhora Desatadora dos Nós, providenciai!',
      },
      {
        day_number: 5,
        title: '5º Dia: O Nó dos Vícios e Apegos Desordenados',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Jesus, Manso e Humilde de Coração, fazei o meu coração semelhante ao Vosso.',
        scripture_reading:
          'Gálatas 5, 1: "É para a liberdade que Cristo nos libertou. Permanecei firmes e não vos deixeis prender de novo ao jugo da escravidão."',
        meditation:
          'Mãe Imaculada, o pecado e os vícios criam laços que nos escravizam e nos enfraquecem espiritualmente. Hoje vos apresento as minhas fragilidades, maus hábitos e apegos que não consigo vencer sozinho.',
        daily_prayer:
          'Ó Virgem Gloriosa, pisai a cabeça da serpente que quer me aprisionar. Com Vossas mãos benditas, desatai o nó de todo vício, pecado recorrente e fraqueza da carne. Concedei-me pureza de coração, fortaleza e santidade. Amém.',
        intentions_prompt: 'Peça a graça da libertação de uma fraqueza ou pecado que tem sido obstáculo na sua caminhada.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. Nossa Senhora Desatadora dos Nós, purificai a nossa alma!',
      },
      {
        day_number: 6,
        title: '6º Dia: O Nó das Doenças Físicas e Emocionais',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Saúde dos Enfermos e Consoladora dos Aflitos, rogai por nós.',
        scripture_reading:
          'Jeremias 17, 14: "Cura-me, Senhor, e ficarei curado; salva-me, e ficarei salvo, porque Tu és o meu louvor."',
        meditation:
          'Mãe Piedosa, quantas dores e enfermidades pesam sobre nós: enfermidades do corpo, depressão, ansiedade e angústia da mente. Tu que estivestes de pé aos pés da Cruz de Teu Filho, conheceis o mistério do sofrimento humano.',
        daily_prayer:
          'Maria, Saúde dos Enfermos, desatai o nó da doença que me debilita e da aflição emocional que rouba a minha serenidade. Dai-me saúde de corpo e alma, e serenidade para acolher a Vontade Divina com paciência e fé. Amém.',
        intentions_prompt: 'Apresente a saúde própria ou de algum enfermo querido.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. Nossa Senhora Desatadora dos Nós, curai-nos!',
      },
      {
        day_number: 7,
        title: '7º Dia: O Nó da Dúvida e do Esfriamento Espiritual',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Creio, Senhor, mas aumentai a minha fraca fé.',
        scripture_reading:
          'Apocalipse 3, 20: "Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei em sua casa e cearei com ele."',
        meditation:
          'Virgem Fiel, às vezes minha oração se torna fria, o cansaço me vence e a dúvida assalta a minha fé. Não permitais que eu me acostume com a tibieza espiritual nem me afaste dos Sacramentos e da vida de graça.',
        daily_prayer:
          'Estrela da Manhã, desatai o nó da frieza de coração, do comodismo e do desleixo com as coisas de Deus. Acendei de novo em minha alma o zelo fervoroso pela oração, o amor à Santa Eucaristia e a fidelidade aos Mandamentos. Amém.',
        intentions_prompt: 'Peça um reavivamento do Espírito Santo na sua vida de oração.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. Nossa Senhora Desatadora dos Nós, aumentai a nossa fé!',
      },
      {
        day_number: 8,
        title: '8º Dia: O Nó das Causas Aparentemente Perdidas',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Santa Mãe de Deus, a Vós me consagro com inteira confiança.',
        scripture_reading:
          'Romanos 8, 31: "Se Deus é por nós, quem será contra nós?"',
        meditation:
          'Mãe Admirável, quando a razão humana diz que não há mais jeito e as portas parecem fechadas para sempre, é aí que brilha o poder da Vossa intercessão diante do trono do Todo-Poderoso. Vós sois a Advogada dos Pecadores e a Esperança dos desesperançados.',
        daily_prayer:
          'Maria Santíssima, apresento-vos esta situação que parece completamente sem solução humana. Desatai este nó impossível! Mostrai que sois Mãe e que Jesus nada nega ao Vosso coração imaculado. Em Vossas mãos descanso minha causa. Amém.',
        intentions_prompt: 'Deposite aquela causa que para os homens parece perdida.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. Nossa Senhora Desatadora dos Nós, socorrei-nos!',
      },
      {
        day_number: 9,
        title: '9º Dia: Ação de Graças e Fidelidade Perpétua',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Minha alma engrandece o Senhor e meu espírito se alegra em Deus, meu Salvador.',
        scripture_reading:
          'Salmo 115, 12: "Que poderei retribuir ao Senhor por todo o bem que me tem feito?"',
        meditation:
          'Chegamos ao último dia desta santa novena. Meu coração se enche de profunda gratidão por todas as graças, visíveis e invisíveis, que já começaram a se derramar em minha vida através das Vossas mãos benditas, ó Maria.',
        daily_prayer:
          'Virgem Mãe Desatadora dos Nós, agradeço-vos por terdes escutado a minha prece. Comprometo-me a viver na Vossa presença materna, perseverando na confissão regular, na oração diária e na caridade com os irmãos. Guarda-me sempre debaixo do Vosso manto protetor. Amém.',
        intentions_prompt: 'Agradeça a Nossa Senhora pela novena concluída e pelas graças que Deus concederá.',
        concluding_prayer:
          'Pai Nosso, Ave Maria, Glória ao Pai e Salve Rainha. Nossa Senhora Desatadora dos Nós, rogai por nós e por nossas famílias para sempre. Amém!',
      },
    ],
  },

  // 2. Santa Rita de Cássia (Causas Impossíveis)
  {
    title: 'Novena a Santa Rita de Cássia',
    slug: 'santa-rita-de-cassia',
    subtitle: 'Advogada das causas impossíveis, desesperadas e aflitas',
    description:
      'Esposa, mãe, viúva e religiosa agostiniana. Santa Rita sofreu com paciência heroica e recebeu na fronte um dos espinhos da Paixão de Cristo. Sua intercessão é infalível junto de Deus.',
    category: 'causas_urgentes',
    tags: ['causas impossíveis', 'paciência', 'perdão', 'casamento', 'cura'],
    feast_date: '05-22',
    ideal_start_date: '05-13',
    banner_color: '#4A0E17',
    is_published: true,
    is_featured: true,
    display_order: 2,
    days: [
      {
        day_number: 1,
        title: '1º Dia: A Juventude e a Vontade de Deus',
        opening_prayer: 'Ó Santa Rita, advogada dos casos desesperados, acolhei com bondade as preces que com fé vos dirijo.',
        scripture_reading: 'Mateus 19, 26: "Aos homens isto é impossível, mas a Deus tudo é possível."',
        meditation: 'Santa Rita aprendeu desde a infância a colocar a vontade do Senhor acima dos seus desejos pessoais. Que ela nos ensine a confiar cegamente no querer de Deus.',
        daily_prayer: 'Gloriosa Santa Rita, alcançai-me do Senhor a graça de submeter os meus planos à santa vontade d’Ele, para que a paz habite no meu coração. Amém.',
        intentions_prompt: 'Apresente a Santa Rita a causa impossível pela qual você reza.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. Santa Rita das Causas Impossíveis, rogai por nós!',
      },
      {
        day_number: 2,
        title: '2º Dia: A Paciência Heróica no Matrimônio',
        opening_prayer: 'Ó Santa Rita, acolhei as angústias do meu coração e intercedei por mim junto ao Salvador.',
        scripture_reading: '1 Coríntios 13, 7: "A caridade tudo desculpa, tudo crê, tudo espera, tudo suporta."',
        meditation: 'Diante de um marido violento, Rita jamais respondeu com ira. Com doçura, oração e lágrimas, alcançou a conversão daquele que parecia irrecuperável.',
        daily_prayer: 'Santa Rita, dai paciência aos esposos e firmeza aos que passam por crises conjugais. Curai os relacionamentos feridos pela amargura. Amém.',
        intentions_prompt: 'Reze pelos casais em crise e pelas famílias em conflito.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. Santa Rita, rogai por nós!',
      },
      {
        day_number: 3,
        title: '3º Dia: O Perdão Heróico e a Paz',
        opening_prayer: 'Ó admirável Santa Rita, espelho de santidade e paciência, ouvi minha súplica.',
        scripture_reading: 'Mateus 6, 14: "Se perdoardes aos homens as suas ofensas, também vosso Pai celeste vos perdoará."',
        meditation: 'Quando seu esposo foi assassinado, Rita perdoou de coração os criminosos e rezou para que seus próprios filhos não se vingassem, preferindo a salvação eterna deles.',
        daily_prayer: 'Santa Rita, arrancai da minha alma todo desejo de vingança ou ressentimento. Dai-me o heroísmo de perdoar como vós perdoastes. Amém.',
        intentions_prompt: 'Peça a graça de perdoar alguém que lhe feriu gravemente.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. Santa Rita, rogai por nós!',
      },
      {
        day_number: 4,
        title: '4º Dia: A Entrada Milagrosa no Claustro',
        opening_prayer: 'Santa Rita, exemplo de fé invencível, olhai para a minha aflição.',
        scripture_reading: 'Salmo 26, 1: "O Senhor é minha luz e minha salvação: de quem terei medo?"',
        meditation: 'Rejeitada repetidas vezes pelas religiosas, Rita não desanimou. Conduzida milagrosamente por São João Batista, Santo Agostinho e São Nicolau, as portas trancadas se abriram.',
        daily_prayer: 'Santa Rita, abri as portas que diante de mim se encontram trancadas. Mostrai o poder da vossa oração diante dos obstáculos humanos insuperáveis. Amém.',
        intentions_prompt: 'Apresente aquele obstáculo que parece intransponível na sua vida.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. Santa Rita, rogai por nós!',
      },
      {
        day_number: 5,
        title: '5º Dia: A Vida de Oração e Penitência',
        opening_prayer: 'Ó Santa Rita, lírio entre espinhos, rogai por mim.',
        scripture_reading: '1 Tessalonicenses 5, 17: "Orai sem cessar."',
        meditation: 'No silêncio do convento de Cássia, Rita jejuava, velava e intercedia continuamente pelos pecadores. A sua força vinha do diálogo íntimo com Deus.',
        daily_prayer: 'Santa Rita, ensinai-me a amar a oração e o silêncio. Fazei com que eu encontre na presença de Jesus o refúgio para todas as minhas tempestades. Amém.',
        intentions_prompt: 'Peça constância e fervor na sua vida de intimidade com Deus.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. Santa Rita, rogai por nós!',
      },
      {
        day_number: 6,
        title: '6º Dia: O Espinho da Paixão de Cristo',
        opening_prayer: 'Ó Santa Rita, associada às dores do Salvador, compadecei-vos de mim.',
        scripture_reading: 'Gálatas 6, 17: "Trago no meu corpo as marcas de Jesus."',
        meditation: 'Pedindo para participar dos sofrimentos de Cristo, um espinho desgarrou-se da coroa do crucifixo e cravou-se na fronte de Rita, ferida que ela carregou por 15 anos com amor.',
        daily_prayer: 'Santa Rita, ensinai-me a carregar a minha cruz diária sem revolta nem desespero, unindo os meus sofrimentos aos sofrimentos redentores de Jesus. Amém.',
        intentions_prompt: 'Ofereça suas dores e cruzes corporais ou morais a Jesus.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. Santa Rita, rogai por nós!',
      },
      {
        day_number: 7,
        title: '7º Dia: A Rosa Florescida no Inverno',
        opening_prayer: 'Ó prodigiosa Santa Rita, esperança dos desesperançados, ouvi-me.',
        scripture_reading: 'Isaías 35, 1: "O deserto e a terra seca se alegrarão; a estepe exultará e florescerá como o lírio."',
        meditation: 'No rigor do inverno, antes de morrer, Rita pediu uma rosa do jardim coberto de neve de sua infância, e a rosa floresceu milagrosamente, símbolo de que nada falta aos que amam a Deus.',
        daily_prayer: 'Santa Rita, fazei florescer as rosas da graça e da esperança no inverno da minha tribulação. Concedei-me a bênção que tanto necessito. Amém.',
        intentions_prompt: 'Peça a graça que parece impossível no momento atual da sua vida.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. Santa Rita, rogai por nós!',
      },
      {
        day_number: 8,
        title: '8º Dia: A Morte Santa e a Glória Celeste',
        opening_prayer: 'Santa Rita bem-aventurada, que agora contemplais face a face o Cordeiro de Deus, acolhei minha oração.',
        scripture_reading: '2 Timóteo 4, 7: "Combati o bom combate, terminei a corrida, guardei a fé."',
        meditation: 'Rita entregou a sua alma em odor de santidade. Os sinos tocaram sozinhos em Cássia e sua cela encheu-se de um perfume suave que perdura até os dias de hoje.',
        daily_prayer: 'Santa Rita gloriosa, que fostes acolhida na glória dos justos, sede a minha protetora em vida e a minha advogada na hora da minha morte. Amém.',
        intentions_prompt: 'Apresente suas intenções espirituais para a salvação da sua alma.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. Santa Rita, rogai por nós!',
      },
      {
        day_number: 9,
        title: '9º Dia: Confiança na Intercessão Infalível',
        opening_prayer: 'Ó Santa Rita de Cássia, minha querida padroeira, a vós entrego todo o meu coração.',
        scripture_reading: 'Tiago 5, 16: "A oração fervorosa do justo tem grande poder."',
        meditation: 'Diante do trono de Deus, Santa Rita não cessa de apresentar as aflições daqueles que recorrem com fé ao seu patrocínio. Ninguém jamais recorreu a ela em vão.',
        daily_prayer: 'Ó Poderosa Santa Rita de Cássia, advogada dos casos desesperados, eu confio na vossa mediação. Apresentai esta minha intenção ao Coração de Jesus e alcançai-me a graça que vos pedi nesta novena. Amém.',
        intentions_prompt: 'Agradeça a Santa Rita com profunda confiança e renove a sua entrega a Deus.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai e Oração Oficial de Santa Rita. Amém!',
      },
    ],
  },

  // 3. Beato Carlo Acutis
  {
    title: 'Novena ao Beato Carlo Acutis',
    slug: 'beato-carlo-acutis',
    subtitle: 'Patrono da internet e apóstolo da Eucaristia para a juventude moderna',
    description:
      'Jovem milanês que usou a tecnologia para evangelizar e espalhar os Milagres Eucarísticos. "A Eucaristia é a minha autoestrada para o Céu."',
    category: 'santos',
    tags: ['juventude', 'eucaristia', 'internet', 'santidade moderna', 'tecnologia'],
    feast_date: '10-12',
    ideal_start_date: '10-03',
    banner_color: '#0047AB',
    is_published: true,
    is_featured: true,
    display_order: 3,
    days: [
      {
        day_number: 1,
        title: '1º Dia: "Não eu, mas Deus"',
        opening_prayer: 'Deus Todo-Poderoso, que concedestes ao Beato Carlo Acutis viver o Evangelho na juventude, ouvi as nossas súplicas por sua intercessão.',
        scripture_reading: 'João 3, 30: "É necessário que Ele cresça e que eu diminua."',
        meditation: 'Carlo dizia com frequência: "Não eu, mas Deus". Ele colocou o Senhor no centro absoluto de todos os seus pensamentos, projetos e ações cotidianas.',
        daily_prayer: 'Beato Carlo, ensinai-me a vencer o orgulho e o egoísmo. Que a minha vida seja orientada para dar glória a Deus em todas as coisas, mesmo nas mais simples. Amém.',
        intentions_prompt: 'Apresente a graça particular que deseja alcançar pela intercessão de Carlo Acutis.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai. Beato Carlo Acutis, rogai por nós!',
      },
      {
        day_number: 2,
        title: '2º Dia: A Eucaristia, Minha Autoestrada para o Céu',
        opening_prayer: 'Santíssima Trindade, Pai, Filho e Espírito Santo, agradeço-Vos pelo dom do Beato Carlo Acutis.',
        scripture_reading: 'João 6, 51: "Eu sou o pão vivo descido do céu. Quem comer deste pão viverá eternamente."',
        meditation: 'A partir da Primeira Comunhão aos 7 anos, Carlo nunca faltou à Santa Missa diária. Para ele, estar diante do Sacrário era como tomar sol espiritual.',
        daily_prayer: 'Beato Carlo, apaixonado pela Hóstia Sagrada, inflamai o meu coração com amor fervoroso a Jesus Eucarístico. Fazei com que eu participe da Santa Missa com devoção sincera. Amém.',
        intentions_prompt: 'Peça a graça de amar profundamente a Santa Missa e a adoração ao Santíssimo.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai. Beato Carlo Acutis, rogai por nós!',
      },
      {
        day_number: 3,
        title: '3º Dia: A Confissão Frequente, o Voo do Balão',
        opening_prayer: 'Senhor Jesus, por intercessão do Beato Carlo, purificai a minha alma de toda mancha de pecado.',
        scripture_reading: '1 João 1, 9: "Se confessarmos os nossos pecados, Ele é fiel e justo para nos perdoar."',
        meditation: 'Carlo comparava a alma a um balão que precisa soltar os pesos para subir ao Céu: "A Confissão é como o fogo que faz o balão subir."',
        daily_prayer: 'Beato Carlo, dai-me a coragem de me confessar com frequência e sinceridade, sem vergonha diante do sacerdote, buscando a verdadeira amizade com Deus. Amém.',
        intentions_prompt: 'Examine sua consciência e peça a graça de uma boa Confissão Sacramental.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai. Beato Carlo Acutis, rogai por nós!',
      },
      {
        day_number: 4,
        title: '4º Dia: O Santo Rosário, a Escada Mais Curta para o Céu',
        opening_prayer: 'Virgem Maria, Mãe do Salvador, a quem Carlo tanto amava, acolhei a minha oração.',
        scripture_reading: 'Lucas 1, 48: "Todas as gerações me chamarão bem-aventurada."',
        meditation: 'Carlo rezava o Terço todos os dias e chamava Nossa Senhora de "a única mulher da minha vida". A oração mariana era seu escudo contra o mal.',
        daily_prayer: 'Beato Carlo, ensinai-me a rezar o Santo Terço com fidelidade diária e carinho filial a Nossa Senhora, para que Ela me guie com segurança a Jesus. Amém.',
        intentions_prompt: 'Consagre a Nossa Senhora os seus jovens, filhos ou afilhados.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai. Beato Carlo Acutis, rogai por nós!',
      },
      {
        day_number: 5,
        title: '5º Dia: Amizade com o Anjo da Guarda',
        opening_prayer: 'Santo Anjo do Senhor, meu zeloso guardador, sede a minha companhia.',
        scripture_reading: 'Salmo 90, 11: "Pois Ele mandará aos Seus anjos que te guardem em todos os teus caminhos."',
        meditation: 'Carlo mantinha uma amizade constante com o seu Anjo da Guarda, a quem pedia auxílio nos estudos, nas dificuldades e na proteção espiritual.',
        daily_prayer: 'Beato Carlo, lembrai-me sempre da presença amiga do meu Anjo da Guarda. Que eu ouça suas inspirações santas e fuja de todas as ocasiões de pecado. Amém.',
        intentions_prompt: 'Reze ao seu Anjo da Guarda pedindo proteção para a sua alma e corpo.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai. Beato Carlo Acutis, rogai por nós!',
      },
      {
        day_number: 6,
        title: '6º Dia: A Caridade Oculta com os Pobres',
        opening_prayer: 'Senhor Jesus, que dissestes: "O que fizestes ao menor dos Meus irmãos, a Mim o fizestes", acolhei minha oração.',
        scripture_reading: 'Mateus 25, 40: "Todas as vezes que fizestes isso a um destes Meus irmãos mais pequeninos, foi a Mim que o fizestes."',
        meditation: 'Carlo economizava sua mesada para comprar sacos de dormir e comida quente para os moradores de rua de Milão, sem que ninguém percebesse.',
        daily_prayer: 'Beato Carlo, abri os meus olhos e o meu coração para os necessitados ao meu redor. Livrai-me da indiferença e dai-me generosidade verdadeira com os irmãos. Amém.',
        intentions_prompt: 'Pense em uma boa obra de caridade concreta para realizar hoje.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai. Beato Carlo Acutis, rogai por nós!',
      },
      {
        day_number: 7,
        title: '7º Dia: A Tecnologia e as Redes a Serviço de Deus',
        opening_prayer: 'Deus nosso Pai, dai-nos sabedoria para usar os dons da inteligência para o bem de todos.',
        scripture_reading: 'Marcos 16, 15: "Ide por todo o mundo e pregai o Evangelho a toda criatura."',
        meditation: 'Carlo foi um pioneiro digital cristão. Ele criou sites para catalogar os milagres eucarísticos do mundo, provando que a internet pode ser um instrumento luminoso de santidade.',
        daily_prayer: 'Beato Carlo, protegei os jovens e todas as famílias dos perigos da internet, das telas e da pornografia. Que a tecnologia seja usada para edificar a fé e a fraternidade. Amém.',
        intentions_prompt: 'Peça pureza e prudência no uso do celular, redes sociais e internet.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai. Beato Carlo Acutis, rogai por nós!',
      },
      {
        day_number: 8,
        title: '8º Dia: "Todos Nascem Originais, mas Muitos Morrem como Fotocópias"',
        opening_prayer: 'Senhor Deus, que nos criastes com amor único e irrepetível, despertai a minha vocação.',
        scripture_reading: 'Jeremias 1, 5: "Antes de te formar no ventre materno, Eu te conheci; antes que saísses do seio, Eu te consagrei."',
        meditation: 'Carlo alertava para a armadilha de seguir as modas fúteis do mundo: "Todos nascem como originais, mas muitos morrem como fotocópias". Ele nos convida a ser quem Deus sonhou.',
        daily_prayer: 'Beato Carlo, livrai-me do medo da opinião alheia e do respeito humano. Ajudai-me a viver a minha fé com autenticidade, firmeza e alegria cristã. Amém.',
        intentions_prompt: 'Peça a graça da autenticidade e da coragem para testemunhar a fé no trabalho e na família.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai. Beato Carlo Acutis, rogai por nós!',
      },
      {
        day_number: 9,
        title: '9º Dia: O Oferecimento dos Sofrimentos e a Páscoa Eterna',
        opening_prayer: 'Senhor Jesus, que acolhestes o sacrifício de amor do jovem Carlo, recebei minha oração.',
        scripture_reading: 'Filipenses 1, 21: "Para mim, o viver é Cristo e o morrer é lucro."',
        meditation: 'Aos 15 anos, diagnosticado com leucemia fulminante, Carlo disse com serenidade: "Ofereço todos os sofrimentos que terei de passar pelo Senhor, pelo Papa e pela Igreja".',
        daily_prayer: 'Ó Deus Pai de Infinita Bondade, que nos destes no Beato Carlo Acutis um amigo no Céu e um modelo de vida eucarística, concedei-me por sua intercessão a graça que Vos peço com fé. E fazei com que eu viva sempre com os olhos voltados para a Pátria Celeste. Amém.',
        intentions_prompt: 'Agradeça a Carlo Acutis pela novena e renove o compromisso de amar Jesus na Eucaristia.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai e Oração Oficial pela Canonização de Carlo Acutis. Amém!',
      },
    ],
  },

  // 4. São Bento Abade
  {
    title: 'Novena a São Bento Abade',
    slug: 'sao-bento-abade',
    subtitle: 'Contra as ciladas do demônio, feitiçarias, inveja e para a libertação espiritual',
    description:
      'Pai dos monges do Ocidente e poderoso patrono contra as forças do mal. A Cruz Sagrada seja a minha Luz!',
    category: 'santos',
    tags: ['proteção', 'libertação', 'são bento', 'contra o mal', 'paz'],
    feast_date: '07-11',
    ideal_start_date: '07-02',
    banner_color: '#1C1917',
    is_published: true,
    is_featured: false,
    display_order: 4,
    days: [
      {
        day_number: 1,
        title: '1º Dia: O Desejo Sincero de Deus',
        opening_prayer: 'A Cruz Sagrada seja a minha Luz, não seja o dragão meu guia. Retira-te, Satanás, nunca me aconselhes coisas vãs. É mau o que me ofereces, bebe tu mesmo o teu veneno.',
        scripture_reading: 'Salmo 33, 15: "Afasta-te do mal e faze o bem; procura a paz e vai atrás dela."',
        meditation: 'São Bento abandonou o mundo para buscar a Deus no silêncio da oração. Ele nos ensina que a vitória sobre o mal começa quando colocamos Deus em primeiro lugar.',
        daily_prayer: 'Glorioso São Bento, alcançai-me do Senhor a graça de buscar a santidade com determinação e renunciar a todas as vaidades do mundo. Amém.',
        intentions_prompt: 'Apresente a São Bento a proteção espiritual da sua casa e família.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. São Bento Abade, rogai por nós!',
      },
      {
        day_number: 2,
        title: '2º Dia: A Vitória sobre as Tentações da Carne',
        opening_prayer: 'A Cruz Sagrada seja a minha Luz, não seja o dragão meu guia.',
        scripture_reading: '1 Coríntios 10, 13: "Deus é fiel: não permitirá que sejais tentados além das vossas forças."',
        meditation: 'Assaltado por uma violenta tentação contra a castidade, Bento lançou-se em meio aos espinhos para dominar a carne pelo amor de Cristo.',
        daily_prayer: 'São Bento, protegei os meus pensamentos, palavras e ações contra as tentações da luxúria e da impureza. Dai-me pureza de coração. Amém.',
        intentions_prompt: 'Peça a virtude da castidade e da sobriedade cristã.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. São Bento, rogai por nós!',
      },
      {
        day_number: 3,
        title: '3º Dia: O Cálice Envenenado e a Proteção da Cruz',
        opening_prayer: 'A Cruz Sagrada seja a minha Luz, não seja o dragão meu guia.',
        scripture_reading: 'Marcos 16, 18: "Se beberem algum veneno mortal, não lhes fará mal algum."',
        meditation: 'Quando monges invejosos tentaram envenenar Bento com uma taça de vinho, ele traçou o Sinal da Cruz e o cálice de vidro quebrou-se em pedaços.',
        daily_prayer: 'São Bento, quebrantai com a força da Cruz de Cristo toda inveja, armadilha, traição e maldade lançada contra mim e minha família. Amém.',
        intentions_prompt: 'Peça proteção contra perigos ocultos, traições e feitiçarias.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. São Bento, rogai por nós!',
      },
      {
        day_number: 4,
        title: '4º Dia: O Pão Envenenado e o Corvo',
        opening_prayer: 'A Cruz Sagrada seja a minha Luz, não seja o dragão meu guia.',
        scripture_reading: 'Salmo 90, 10: "Nenhum mal te atingirá, desgraça alguma chegará à tua tenda."',
        meditation: 'Novamente atacado com um pão envenenado, Bento ordenou a um corvo que o levasse para longe onde ninguém pudesse ser prejudicado. Deus protege os Seus escolhidos.',
        daily_prayer: 'São Bento, afastai da minha mesa e do meu lar todo veneno espiritual e temporal. Livrai-nos de falsos amigos e de perigos mortais. Amém.',
        intentions_prompt: 'Reze pela paz e harmonia entre vizinhos, colegas e parentes.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. São Bento, rogai por nós!',
      },
      {
        day_number: 5,
        title: '5º Dia: "Ora et Labora" — A Santificação do Trabalho',
        opening_prayer: 'A Cruz Sagrada seja a minha Luz, não seja o dragão meu guia.',
        scripture_reading: 'Colossenses 3, 23: "Tudo o que fizerdes, fazei-o de bom coração, como para o Senhor e não para os homens."',
        meditation: 'A regra de ouro de São Bento: "Reza e Trabalha". Ele ensinou que o trabalho honesto unido à oração fecha as portas para a ociosidade, que é mãe dos vícios.',
        daily_prayer: 'São Bento, abençoai o meu trabalho e os meus estudos. Que o meu suor diário sirva para a glória de Deus e para o sustento honrado da minha família. Amém.',
        intentions_prompt: 'Apresente suas atividades profissionais e projetos de trabalho.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. São Bento, rogai por nós!',
      },
      {
        day_number: 6,
        title: '6º Dia: O Dom do Discernimento e da Paz',
        opening_prayer: 'A Cruz Sagrada seja a minha Luz, não seja o dragão meu guia.',
        scripture_reading: 'Filipenses 4, 7: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos."',
        meditation: 'A palavra central na Medalha de São Bento é "PAX" (Paz). Onde reina o Espírito de Deus, o medo, a discórdia e o tumulto do inimigo se dissipam.',
        daily_prayer: 'São Bento, dai-me sabedoria para discernir a verdade do engano. Que a paz de Cristo reine em minha mente e em minha casa todos os dias. Amém.',
        intentions_prompt: 'Peça discernimento para uma decisão difícil.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. São Bento, rogai por nós!',
      },
      {
        day_number: 7,
        title: '7º Dia: A Fraternidade com Santa Escolástica',
        opening_prayer: 'A Cruz Sagrada seja a minha Luz, não seja o dragão meu guia.',
        scripture_reading: '1 João 4, 7: "Amados, amemo-nos uns aos outros, porque o amor é de Deus."',
        meditation: 'Bento e sua irmã gêmea, Santa Escolástica, encontravam-se para conversar sobre os mistérios do Céu. A oração de Escolástica foi tão intensa que moveu o Céu.',
        daily_prayer: 'São Bento, protegei os irmãos de sangue e os irmãos de fé. Que os nossos laços familiares sejam alicerçados no amor cristão e na oração mútua. Amém.',
        intentions_prompt: 'Reze pelos seus irmãos e familiares mais próximos.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. São Bento, rogai por nós!',
      },
      {
        day_number: 8,
        title: '8º Dia: A Vitória Final sobre o Inimigo Infernal',
        opening_prayer: 'A Cruz Sagrada seja a minha Luz, não seja o dragão meu guia.',
        scripture_reading: 'Efésios 6, 11: "Revesti-vos da armadura de Deus, para poderdes resistir às ciladas do diabo."',
        meditation: 'O demônio tentou incessantemente perturbar a obra monástica de Bento, mas era sempre expulso pela autoridade do Santo Nome de Jesus e pelo sinal da Cruz.',
        daily_prayer: 'Glorioso patriarca São Bento, erguei sobre a minha vida o escudo da Santa Cruz. Que nenhum espírito maligno tenha poder sobre a minha alma nem sobre aqueles a quem amo. Amém.',
        intentions_prompt: 'Reze pela libertação de amarras espirituais e perturbações no sono.',
        concluding_prayer: 'Pai Nosso, Ave Maria e Glória ao Pai. São Bento, rogai por nós!',
      },
      {
        day_number: 9,
        title: '9º Dia: A Morte Santa de Pé na Capela',
        opening_prayer: 'A Cruz Sagrada seja a minha Luz, não seja o dragão meu guia.',
        scripture_reading: 'Lucas 2, 29: "Agora, Senhor, podes deixar partir o Teu servo em paz, segundo a Tua palavra."',
        meditation: 'Sentindo aproximar-se a morte, São Bento fez-se levar à capela, recebeu a Eucaristia e expirou de pé, sustentado pelos braços dos seus discípulos e orando a Deus.',
        daily_prayer: 'São Bento, padroeiro da boa morte, alcançai-me a graça da perseverança final. Que na hora derradeira eu esteja fortalecido pelos Sacramentos e acolhido nos braços do Pai. Amém.',
        intentions_prompt: 'Agradeça a São Bento pela novena e peça perseverança na fé.',
        concluding_prayer: 'Pai Nosso, Ave Maria, Glória ao Pai e Oração de São Bento. Amém!',
      },
    ],
  },
  // 3. São João Paulo II
  {
    title: 'Novena a São João Paulo II',
    slug: 'novena-sao-joao-paulo-ii',
    subtitle: 'Apóstolo da Esperança, da Divina Misericórdia e Padroeiro da Juventude',
    description:
      'Reze durante os 9 dias que antecedem a festa litúrgica de São João Paulo II (22 de Outubro), pedindo coragem para não ter medo e confiança filial na Divina Misericórdia e em Maria Santíssima (Totus Tuus).',
    category: 'santos',
    tags: ['são joão paulo ii', 'misericórdia', 'família', 'juventude', 'totus tuus'],
    feast_date: '10-22',
    ideal_start_date: '10-14',
    banner_color: '#002D6E',
    is_published: true,
    is_featured: true,
    display_order: 3,
    days: [
      {
        day_number: 1,
        title: '1º Dia: "Não Tenhais Medo! Abri as Portas a Cristo!"',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Ó Deus, rico em misericórdia, que chamastes São João Paulo II para governar a Vossa Igreja e proclamar a esperança ao mundo inteiro, concedei-nos, por sua intercessão, a graça de abrir sem reservas as portas do nosso coração a Cristo Jesus.',
        scripture_reading:
          'Mateus 14, 27: "Tende coragem, sou Eu, não tenhais medo!"',
        meditation:
          'Na homilia de inauguração do seu pontificado, em 22 de outubro de 1978, João Paulo II proclamou: "Não tenhais medo! Abri, melhor, escancarai as portas a Cristo!" Quantas vezes o medo da incerteza, da fraqueza ou do futuro nos paralisa. Hoje somos convidados a entregar todos os nossos receios nas mãos d\'Aquele que venceu o mundo.',
        daily_prayer:
          'São João Paulo II, que enfrentastes guerras, perseguições e sofrimentos com o olhar fixo no Redentor do Homem, ajudai-me a vencer todos os medos que me afastam da vontade do Pai. Concedei-me intrepidez na fé e confiança inabalável em Deus. Amém.',
        intentions_prompt: 'Apresente a São João Paulo II a intenção particular desta novena e os medos que você deseja superar.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. São João Paulo II, rogai por nós!',
      },
      {
        day_number: 2,
        title: '2º Dia: Totus Tuus — A Consagração a Nossa Senhora',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Virgem Mãe de Deus e nossa Mãe, renovo hoje a entrega de todo o meu ser nas Vossas mãos imaculadas, a exemplo de Vosso servo João Paulo II.',
        scripture_reading:
          'João 19, 27: "Depois disse ao discípulo: Eis aí a tua mãe. E dessa hora em diante o discípulo a acolheu em sua casa."',
        meditation:
          'O lema episcopal de Karol Wojtyła era "Totus Tuus ego sum et omnia mea tua sunt" (Sou todo Teu e tudo o que é meu Te pertence). Após o atentado na Praça de São Pedro em 13 de maio de 1981, ele testemunhou que uma mão materna guiou a trajetória do projétil, salvando sua vida. Ele nos ensina que o caminho mais curto e seguro para Jesus é a consagração filial a Maria.',
        daily_prayer:
          'São João Paulo II, ensinai-me a amar a Virgem Maria com o mesmo ardor com que a amastes. Que sob o manto materno de Nossa Senhora eu encontre refúgio nas tribulações e luz para cumprir minha vocação. Maria, sou todo Vosso! Amém.',
        intentions_prompt: 'Entregue a Nossa Senhora a sua vida e peça a fidelidade na consagração diária.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. São João Paulo II, rogai por nós!',
      },
      {
        day_number: 3,
        title: '3º Dia: Apóstolo da Divina Misericórdia',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Ó Sangue e Água que jorrastes do Coração de Jesus como fonte de misericórdia para nós, eu confio em Vós!',
        scripture_reading:
          'Efésios 2, 4-5: "Mas Deus, que é rico em misericórdia, pelo grande amor com que nos amou, deu-nos vida juntamente com Cristo."',
        meditation:
          'São João Paulo II foi o Papa que canonizou Santa Faustina Kowalska e instituiu o Domingo da Divina Misericórdia para toda a Igreja universal. Ele ensinava que a misericórdia de Deus é o único limite colocado pelo Amor Divino contra o poder do mal na história humana.',
        daily_prayer:
          'São João Paulo II, instrumento fiel da Misericórdia do Senhor, alcançai-me a graça de jamais duvidar do perdão e da bondade infinita de Jesus. Que eu saiba acolher a misericórdia e praticar as obras de caridade para com os meus irmãos mais necessitados. Jesus, eu confio em Vós! Amém.',
        intentions_prompt: 'Reze pela conversão dos pecadores e peça perdão pelos momentos em que faltou com a misericórdia.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. São João Paulo II, rogai por nós!',
      },
      {
        day_number: 4,
        title: '4º Dia: O Guardião e Defensor da Família e da Vida',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Senhor Deus, que no seio da Sagrada Família de Nazaré santificastes a vida humana e o amor esponsal, abençoai todos os lares do mundo.',
        scripture_reading:
          'Gênesis 1, 27: "Deus criou o homem à sua imagem, à imagem de Deus Ele o criou; homem e mulher os criou."',
        meditation:
          'São João Paulo II quis ser lembrado como o "Papa da Família". Ele nos deixou um legado incomparável com a Teologia do Corpo e a encíclica Evangelium Vitae, defendendo incansavelmente a sacralidade da vida humana desde a sua concepção até o seu término natural.',
        daily_prayer:
          'São João Paulo II, rogai por nossas famílias. Afastai do nosso lar as ameaças da desunião, da falta de diálogo, do egoísmo e da infidelidade. Abençoai os casais, as crianças e os idosos, para que cada família cristã seja um santuário de amor e paz. Amém.',
        intentions_prompt: 'Coloque sob a intercessão do Santo a sua família, casamento e parentes.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. São João Paulo II, rogai por nós!',
      },
      {
        day_number: 5,
        title: '5º Dia: O Amigo e Pastor da Juventude',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Senhor Jesus, amigo dos jovens, enviai o Vosso Santo Espírito sobre a nova geração.',
        scripture_reading:
          '1 Timóteo 4, 12: "Ninguém te despreze por seres jovem; pelo contrário, sê para os fiéis o modelo na palavra, na conduta, no amor, na fé, na pureza."',
        meditation:
          'Foi São João Paulo II quem criou a Jornada Mundial da Juventude (JMJ), reunindo milhões de jovens em todos os continentes. Ele olhava nos olhos dos jovens e dizia: "Vós sois a esperança da Igreja, vós sois a minha esperança! Não tenhais medo de ser santos!"',
        daily_prayer:
          'São João Paulo II, intercedei por todos os jovens do mundo, especialmente aqueles que se sentem desorientados, vazios de sentido ou seduzidos pelas ilusões passageiras deste mundo. Despertai neles a coragem de seguir radicalmente o Evangelho de Jesus. Amém.',
        intentions_prompt: 'Reze pelos jovens de sua família e da sua comunidade paroquial.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. São João Paulo II, rogai por nós!',
      },
      {
        day_number: 6,
        title: '6º Dia: O Valor Redentor do Sofrimento e da Cruz',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Nós vos adoramos, ó Cristo, e vos bendizemos, porque pela vossa santa Cruz remistes o mundo.',
        scripture_reading:
          'Colossenses 1, 24: "Alegro-me nos sofrimentos por vós e completo na minha carne o que falta às tribulações de Cristo em favor do Seu Corpo, que é a Igreja."',
        meditation:
          'Em sua encíclica Salvifici Doloris e na própria fragilidade da velhice e da doença pública, São João Paulo II nos ensinou que o sofrimento humano, quando unido à Cruz de Nosso Senhor Jesus Cristo, torna-se fonte inestimável de graça, purificação e redenção para toda a humanidade.',
        daily_prayer:
          'São João Paulo II, que suportastes a dor, o mal de Parkinson e as enfermidades com tanta nobreza e fé pascal, ajudai-me a não desperdiçar as cruzes da minha existência. Ensinai-me a unir as minhas dores às dores de Jesus pela salvação das almas. Amém.',
        intentions_prompt: 'Ofereça a Deus as suas dores físicas, emocionais ou espirituais unidas à Cruz de Cristo.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. São João Paulo II, rogai por nós!',
      },
      {
        day_number: 7,
        title: '7º Dia: Adorador Apaixonado da Santíssima Eucaristia',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Graças e louvores sejam dados a todo momento ao Santíssimo e Diviníssimo Sacramento.',
        scripture_reading:
          'João 6, 51: "Eu sou o pão vivo descido do céu. Quem comer deste pão viverá eternamente."',
        meditation:
          'A força motriz de toda a vida e das viagens de São João Paulo II era a Santa Eucaristia. Ele passava longas horas prostrado diante do Sacrário em oração e contemplação silenciosa. Em sua última encíclica, Ecclesia de Eucharistia, ele nos convidou a renovar o assombro e a reverência diante do Mistério do Altar.',
        daily_prayer:
          'São João Paulo II, inflamai o meu coração com amor sincero a Jesus Sacramentado. Que eu nunca participe da Santa Missa por rotina, mas sempre com reverência, gratidão e sede de santidade. Ensinai-me a visitar com frequência o Senhor no sacrário. Amém.',
        intentions_prompt: 'Faça uma comunhão espiritual ou visite Jesus no Sacrário neste dia.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. São João Paulo II, rogai por nós!',
      },
      {
        day_number: 8,
        title: '8º Dia: A Vocação Universal à Santidade no Cotidiano',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Santo, Santo, Santo é o Senhor Deus do universo.',
        scripture_reading:
          '1 Tessalonicenses 4, 3: "Pois esta é a vontade de Deus: a vossa santificação."',
        meditation:
          'Na carta apostólica Novo Millennio Ineunte, o Papa Wojtyła lembrou que a santidade não é privilégio de poucos, mas a medida alta da vida cristã ordinária para todo batizado: pais, mães, estudantes, trabalhadores e profissionais. Ser santo é permitir que a graça de Cristo transforme cada gesto do nosso cotidiano.',
        daily_prayer:
          'São João Paulo II, que beatificastes e canonizastes tantos homens e mulheres comuns que viveram heroicamente as virtudes, ajudai-me a buscar a santidade no cumprimento fiel dos meus deveres diários com amor e integridade. Amém.',
        intentions_prompt: 'Peça a graça da coerência de vida e da perseverança no caminho da santidade.',
        concluding_prayer:
          'Pai Nosso, Ave Maria e Glória ao Pai. São João Paulo II, rogai por nós!',
      },
      {
        day_number: 9,
        title: '9º Dia: A Esperança da Glória Eterna na Casa do Pai',
        opening_prayer:
          'Em nome do Pai, do Filho e do Espírito Santo. Amém. Vinde, benditos de meu Pai, tomai posse do Reino preparado para vós desde a criação do mundo.',
        scripture_reading:
          'Apocalipse 21, 4: "Ele enxugará toda lágrima dos seus olhos. A morte já não existirá, nem luto, nem clamor, nem dor, porque as primeiras coisas passaram."',
        meditation:
          'Em 2 de abril de 2005, vigília do Domingo da Divina Misericórdia, o mundo acompanhou com profunda comoção os últimos instantes de São João Paulo II nesta terra. Suas últimas palavras sussurradas foram: "Deixai-me ir para a casa do Pai". Ele cruzou o limiar da esperança para contemplar eternamente a face de Deus.',
        daily_prayer:
          'Ó São João Paulo II, da janela do Céu abençoai a Igreja, o Brasil e cada um de nós! Acolhei as intenções que vos apresentamos com fé durante estes 9 dias de novena e apresentai-as ao Coração Misericordioso de Jesus e às mãos ternas de Maria. Que possamos um dia nos encontrar na glória eterna. Amém.',
        intentions_prompt: 'Agradeça a São João Paulo II pelas graças alcançadas e confie com paz no atendimento de sua prece.',
        concluding_prayer:
          'Pai Nosso, Ave Maria, Glória ao Pai e Ladainha de São João Paulo II. Amém!',
      },
    ],
  },
];

