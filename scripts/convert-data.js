const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('usa-real-estate-dataset/realtor-data.csv')
  .pipe(csv())
  .on('data', (data) => {
    results.push({
      id: data.realty_id || Math.random().toString(36).substr(2, 9),
      status: data.status || 'for_sale',
      price: parseFloat(data.price) || 0,
      bed: parseInt(data.bed) || 0,
      bath: parseFloat(data.bath) || 0,
      acre_lot: parseFloat(data.acre_lot) || 0,
      street: data.street || '',
      city: data.city || '',
      state: data.state || '',
      zip_code: data.zip_code || '',
      house_size: parseInt(data.house_size) || 0,
      prev_sold_date: data.prev_sold_date || null,
      broker: data.broker || '',
      property_type: data.property_type || 'house',
      description: data.description || '',
      image_url: data.image_url || '',
    });
  })
  .on('end', () => {
    // Take first 500 for demo (you can adjust)
    const sampleData = results.slice(0, 500);
    fs.writeFileSync('assets/data/properties.json', JSON.stringify(sampleData, null, 2));
    console.log(`Converted ${sampleData.length} properties`);
  });