import dotenv from 'dotenv';

dotenv.config();

async function testPhoneFormats() {
  console.log('📞 Testando formatos de telefone do WhatsApp\n');

  // Simular números como vêm do WhatsApp
  const whatsappFormats = [
    '553291473412@s.whatsapp.net',  // Eduardo
    '553284630707@s.whatsapp.net',  // Flavio
    '5532999999999@s.whatsapp.net', // Usuário 1
    '553287058835@s.whatsapp.net',  // Janssem
  ];

  console.log('Formatos que vêm do WhatsApp:');
  whatsappFormats.forEach(format => {
    const phone = format.split('@')[0];
    const withPlus = phone.startsWith('+') ? phone : `+${phone}`;
    
    console.log(`\n  WhatsApp: ${format}`);
    console.log(`  Extraído: ${phone}`);
    console.log(`  Com +: ${withPlus}`);
  });

  console.log('\n\n✅ Comparação concluída!');
}

testPhoneFormats();
