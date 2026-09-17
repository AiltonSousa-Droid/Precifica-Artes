import { ArtType, CalculationInput, CalculationResult, ProposalSettings } from '../types';
import { formatBRL, getItemPluralLabel } from './calculations';

export function getArtTypeLabel(artType: ArtType, quantity: number): string {
  const plural = quantity > 1;
  switch (artType) {
    case 'feed_simples':
      return plural ? 'artes para feed' : 'arte para feed';
    case 'feed_elaborado':
      return plural ? 'artes para feed elaborado' : 'arte para feed elaborado';
    case 'story':
      return plural ? 'artes para stories' : 'arte para stories';
    case 'carrossel':
      return plural ? 'artes em formato carrossel' : 'arte em formato carrossel';
    case 'capa':
      return plural ? 'capas personalizadas' : 'capa personalizada';
    case 'thumbnail':
      return plural ? 'thumbnails para vídeo/mídia' : 'thumbnail para vídeo/mídia';
    case 'outro':
      return plural ? 'peças de design gráfico' : 'peça de design gráfico';
    default:
      return 'artes digitais';
  }
}

export function generateProposalText(
  input: CalculationInput,
  result: CalculationResult,
  proposalSettings: ProposalSettings
): string {
  const clientName = input.clientName ? `Olá, ${input.clientName.trim()}!` : 'Olá!';
  const priceFormatted = formatBRL(result.effectivePrice, 0);
  const days = input.deadlineDays || proposalSettings.defaultDeadlineDays || 5;

  const revisionText =
    input.includedRevisionRounds === 1
      ? '1 rodada de alterações inclusa para o projeto'
      : `${input.includedRevisionRounds} rodadas de alterações inclusas para o projeto`;

  let additionalRevisionNote = '';
  if (input.additionalRevisionPrice > 0) {
    additionalRevisionNote = `\n• Rodada extra de alteração: ${formatBRL(input.additionalRevisionPrice, 0)}/rodada`;
  }

  // Build items lines
  const itemsLines: string[] = [];
  if (result.itemsBreakdown && result.itemsBreakdown.length > 0) {
    result.itemsBreakdown.forEach((it) => {
      const label = getItemPluralLabel(it.artType, it.quantity, it.customName);
      itemsLines.push(`• ${label}`);
    });
    if (result.totalDeliverables > 1 && result.itemsBreakdown.length > 1) {
      itemsLines.push(`  (Total: ${result.totalDeliverables} entregáveis no projeto)`);
    }
  } else if (input.quantity && input.artType) {
    const artLabel = getArtTypeLabel(input.artType, input.quantity);
    itemsLines.push(`• ${input.quantity} ${artLabel}`);
  } else {
    itemsLines.push('• Peças personalizadas de design');
  }

  const lines: string[] = [
    `${clientName} Segue a proposta comercial para o seu projeto de design:`,
    '',
    `📌 Investimento: ${priceFormatted}`,
    '',
    '📦 O pacote inclui:',
    ...itemsLines,
    '• Desenvolvimento visual estratégico e personalizado',
    '• Padronização estética e aplicação da sua identidade visual',
    `• ${revisionText}`,
    '• Arquivos finais em alta resolução prontos para publicação (PNG/JPG)',
  ];

  if (input.projectName) {
    lines.splice(2, 0, `🎯 Projeto: ${input.projectName.trim()}`);
  }

  lines.push('');
  lines.push(`⏱️ Prazo de entrega estimado: ${days} dias úteis`);

  if (proposalSettings.paymentTerms) {
    lines.push(`💳 Condições de pagamento: ${proposalSettings.paymentTerms}`);
  }

  if (proposalSettings.revisionPolicy) {
    lines.push(`📋 Política de alterações: ${proposalSettings.revisionPolicy}`);
  }

  if (additionalRevisionNote) {
    lines.push(additionalRevisionNote.trim());
  }

  if (proposalSettings.defaultNotes) {
    lines.push('');
    lines.push(`💡 Observações: ${proposalSettings.defaultNotes}`);
  }

  lines.push('');
  lines.push('Fico à disposição para tirar qualquer dúvida e darmos início ao trabalho!');

  if (proposalSettings.professionalName || proposalSettings.companyName) {
    lines.push('');
    const nameLine = [proposalSettings.professionalName, proposalSettings.companyName]
      .filter(Boolean)
      .join(' | ');
    lines.push(`Atenciosamente,`);
    lines.push(`✨ ${nameLine}`);
    if (proposalSettings.whatsapp) {
      lines.push(`📱 WhatsApp: ${proposalSettings.whatsapp}`);
    }
    if (proposalSettings.instagram) {
      lines.push(`📸 Instagram: ${proposalSettings.instagram}`);
    }
  }

  return lines.join('\n');
}

export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
