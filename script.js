// Inicialización del mapa
const map = L.map('map', { zoomControl: false, attributionControl: false })
  .setView([-38.4, -63.6], 4.2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 10,
  minZoom: 4,
  attribution: '© OpenStreetMap | © CARTO'
}).addTo(map);

// DOM
const sidebar = document.getElementById('sidebar'),
  title = document.getElementById('sidebar-title'),
  lista = document.getElementById('carreras-list'),
  provincesBtn = document.getElementById('provinces-btn'),
  provincesDropdown = document.getElementById('provinces-dropdown-content'),
  creditsBtn = document.getElementById('credits-btn'),
  creditsModal = document.getElementById('credits-modal'),
  closeModalBtn = document.getElementById('close-modal-btn'),
  statsBtn = document.getElementById('stats-btn'),
  statsModal = document.getElementById('stats-modal'),
  closeStatsBtn = document.getElementById('close-stats-btn');

// Interacciones UI
document.getElementById('close-btn').onclick = () => {
  sidebar.classList.remove('open');
  setTimeout(() => sidebar.style.display = 'none', 400);
};

provincesBtn.onclick = e => {
  e.stopPropagation();
  provincesDropdown.classList.toggle('show');
};

window.addEventListener('click', e => {
  if (!e.target.closest('#provinces-btn')) {
    provincesDropdown.classList.remove('show');
  }
});

creditsBtn.onclick = () => creditsModal.classList.remove('hidden');
closeModalBtn.onclick = () => creditsModal.classList.add('hidden');

statsBtn.onclick = () => statsModal.classList.remove('hidden');
closeStatsBtn.onclick = () => statsModal.classList.add('hidden');

window.onclick = e => {
  if (e.target === creditsModal) creditsModal.classList.add('hidden');
  if (e.target === statsModal) statsModal.classList.add('hidden');
};

// Cargar CSV externamente
fetch('carreras.csv')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error al cargar el CSV: ${response.status}`);
    }
    return response.text();
  })
  .then(csvRaw => {
    const filas = Papa.parse(csvRaw, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true
    }).data;

    console.log("✅ Filas parseadas:", filas);

    // Llamar a la función solo si hay filas válidas
    if (filas && filas.length > 0) {
      procesarDatos(filas);
      console.log("PROCESAR DATOS OK");   
    } else {
      console.error("❌ No se encontraron filas válidas en el CSV.");
    }
  })
  .catch(error => {
    console.error("❌ Error cargando carreras.csv:", error);
  });

// Procesamiento principal
function procesarDatos(filas) {
  const ciudadesCarreras = {}, provinciasCarreras = {}, cityToProvinceMap = {};

  filas.forEach(f => {
    const prov = (f.PROVINCIA || '').trim(),
          ciudad = (f.CIUDAD || '').trim(),
          uni = (f.UNIVERSIDAD || '').trim(),
          carrera = (f.CARRERA || '').trim();
    if (!prov || !ciudad || !uni || !carrera) {
      console.log("Fila incompleta:", f); // <-- LOGUEA SI ESTÁ MAL
      return;
    }

    const nodo = {
      carrera,
      facultad: (f.FACULTAD || '').trim(),
      tipo: (f['M.POPULAR / M.ACADÉMICA'] || '').trim(),
      anio: (f['AÑO DEL ÚLTIMO PLAN DE ESTUDIOS RELEVADO'] || '').trim(),
      plan: (f['PLAN DE ESTUDIOS'] || '').trim()
    };

    ciudadesCarreras[ciudad] ??= {};
    ciudadesCarreras[ciudad][uni] ??= [];
    ciudadesCarreras[ciudad][uni].push(nodo);

    provinciasCarreras[prov] ??= {};
    provinciasCarreras[prov][ciudad] ??= {};
    provinciasCarreras[prov][ciudad][uni] ??= [];
    provinciasCarreras[prov][ciudad][uni].push(nodo);

    cityToProvinceMap[ciudad] ??= prov;
  });

  const coordsCiudades = {
    "SANTA FÉ": [-31.6333, -60.7],
    "ROSARIO": [-32.9546, -60.6394],
    "LA RIOJA": [-29.4131, -66.8558],
    "MENDOZA": [-32.8895, -68.8458],
    "CÓRDOBA": [-31.4201, -64.1888],
    "VILLA MARIA": [-32.4103, -63.2363],
    "SAN JUAN": [-31.5375, -68.5364],
    "JACHAL": [-30.2408, -68.7484],
    "CABA": [-34.6037, -58.3816],
    "CASEROS": [-34.6097, -58.5620],
    "DEPARTAMENTO SAN MARTÍN": [-34.5646, -58.53],
    "LANÚS": [-34.7061, -58.3983],
    "AVELLANEDA": [-34.6638, -58.3645],
    "QUILMES": [-34.7201, -58.2542],
    "LA PLATA": [-34.9214, -57.9544],
    "SAN LUIS": [-33.295, -66.3356]
  };

  // Mapeo de colores según tipo de carrera
const tipoColorMap = {
  'Música académica': '#c1244E',
  'Académica con mención a lo popular': '#c14924',
  'Académica y popular': '#c19724',
  'Popular con mención a lo académico': '#24C197',
  'Música popular': '#244EC1'
};

// Marcadores por ciudad
Object.entries(ciudadesCarreras).forEach(([ciudad, uniObj]) => {
  const pos = coordsCiudades[ciudad.toUpperCase()];
  if (!pos) {
    console.warn('⚠️ Falta coordenada:', ciudad);
    return;
  }

  // Contar cantidad por tipo
  const tipos = {};
  Object.values(uniObj).flat().forEach(({ tipo }) => {
    tipos[tipo] = (tipos[tipo] || 0) + 1;
  });

  // Tipo predominante
  const tipoPredominante = Object.entries(tipos).sort((a, b) => b[1] - a[1])[0]?.[0];
  const color = tipoColorMap[tipoPredominante] || '#999';

  // Crear ícono personalizado
  const icon = new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="background:${color}; width:18px; height:18px; border-radius:50%; border:2px solid white; box-shadow:0 0 2px #000;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  // Agregar al mapa
  L.marker(pos, { icon })
    .addTo(map)
    .bindPopup(`<strong>${ciudad}</strong><br>${Object.values(uniObj).flat().length} carreras`)
    .on('click', () => mostrarSidebarCiudad(ciudad, uniObj));
  });


  provincesDropdown.innerHTML = '';
  Object.keys(provinciasCarreras).sort().forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'prov-btn';
    btn.textContent = p;
    btn.onclick = () => {
      zoomYSidebarProvincia(p);
      provincesDropdown.classList.remove('show');
    };
    provincesDropdown.appendChild(btn);
  });

  function mostrarSidebarCiudad(ciudad, uniObj) {
    title.textContent = ciudad;
    lista.innerHTML = Object.entries(uniObj)
      .map(([uni, carreras]) => `<details open><summary>${uni} (${carreras.length})</summary><ul>${htmlCarreras(carreras)}</ul></details>`)
      .join('');
    sidebar.style.display = 'block';
    requestAnimationFrame(() => sidebar.classList.add('open'));
  }

  function mostrarSidebarProvincia(prov) {
    title.textContent = prov;
    const ciudades = provinciasCarreras[prov];
    lista.innerHTML = Object.entries(ciudades)
      .map(([ciudad, uniObj]) => `<details><summary>${ciudad} (${Object.values(uniObj).flat().length})</summary>${Object.entries(uniObj).map(([uni, carreras]) => `<details style="margin-left: 1em"><summary>${uni} (${carreras.length})</summary><ul>${htmlCarreras(carreras)}</ul></details>`).join('')}</details>`)
      .join('');
    sidebar.classList.add('open');
  }

  function zoomYSidebarProvincia(prov) {
    const ciudades = Object.keys(provinciasCarreras[prov]);
    const coords = ciudades.map(c => coordsCiudades[c.toUpperCase()]).filter(Boolean);
    if (!coords.length) return;
    const latSum = coords.reduce((sum, [lat]) => sum + lat, 0);
    const lngSum = coords.reduce((sum, [, lng]) => sum + lng, 0);
    map.setView([latSum / coords.length, lngSum / coords.length], 7);
    mostrarSidebarProvincia(prov);
  }

  function ordenarCarreras(arr) {
    return arr.slice().sort((a, b) => a.carrera.localeCompare(b.carrera));
  }

  function htmlCarreras(arr) {
    return ordenarCarreras(arr)
      .map(c => `<li><strong>${c.carrera}</strong><br /><span class="uni">${c.facultad}</span><br /><span class="tipo">${c.tipo}</span><br />${c.anio ? `<span class="anio">Plan: ${c.anio}</span><br />` : ''}${c.plan ? `<a href="${c.plan}" target="_blank" rel="noopener">Ver plan</a>` : ''}</li>`)
      .join('');
  }
}

// Cargar logos en créditos
const logos = document.createElement('div');
logos.style.display = 'flex';
logos.style.justifyContent = 'center';
logos.style.gap = '20px';
logos.style.marginTop = '20px';

const link1 = document.createElement('a');
link1.href = 'https://www.unsl.edu.ar';
link1.target = '_blank';
link1.rel = 'noopener';
const logo1 = document.createElement('img');
logo1.src = 'https://www.unsl.edu.ar/imagenes/iconos/isologo_unsl_color_footer.webp';
logo1.alt = 'Logo UNSL';
logo1.style.height = '50px';
link1.appendChild(logo1);

const link2 = document.createElement('a');
link2.href = 'https://humanas.unsl.edu.ar';
link2.target = '_blank';
link2.rel = 'noopener';
const logo2 = document.createElement('img');
logo2.src = 'https://www.argonautas.unsl.edu.ar/FCHLogo.png';
logo2.alt = 'Logo FCH';
logo2.style.height = '50px';
link2.appendChild(logo2);

logos.appendChild(link1);
logos.appendChild(link2);
document.querySelector('#credits-modal .modal-content').appendChild(logos);

// Datos de carreras fijos (para estadística)
const estadisticas = {
  labels: [
    'Música académica',
    'Académica con mención a lo popular',
    'Académica y popular',
    'Popular con mención a lo académico',
    'Música popular'
  ],
  values: [175, 23, 5, 4, 18]
};

const totalCarreras = estadisticas.values.reduce((a, b) => a + b, 0);
const porcentajes = estadisticas.values.map(v => ((v / totalCarreras) * 100).toFixed(1));

let pieChart, barChart;
let chartsRendered = false;

statsBtn.onclick = () => {
  statsModal.classList.remove('hidden');

  if (!chartsRendered) {
    const pieCtx = document.getElementById('stats-pie').getContext('2d');
    const barCtx = document.getElementById('stats-bar').getContext('2d');

    const totalCarreras = estadisticas.values.reduce((a, b) => a + b, 0);
    const porcentajes = estadisticas.values.map(v => ((v / totalCarreras) * 100).toFixed(1));

    pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: estadisticas.labels.map((l, i) => `${l} (${porcentajes[i]}%)`),
        datasets: [{
          data: estadisticas.values,
          backgroundColor: ['#c1244E', '#c14924', '#c19724', '#24C197', '#244EC1'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: `Distribución de ${totalCarreras} carreras`,
            color: '#333',
            font: { size: 16 }
          },
          legend: {
            position: 'bottom',
            labels: { color: '#333' }
          }
        }
      }
    });

    const isMobile = window.innerWidth < 600;

new Chart(barCtx, {
  type: 'bar',
  data: {
    labels: estadisticas.labels,
    datasets: [{
      label: 'Cantidad de carreras',
      data: estadisticas.values,
      backgroundColor: ['#c1244E', '#c14924', '#c19724', '#24C197', '#244EC1']
    }]
  },
  options: {
    aspectRatio: isMobile ? 1 : 1.2,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Cantidad por tipo',
        color: '#333',
        font: { size: 16 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#333' },
        title: {
          display: true,
          text: 'Carreras',
          color: '#333'
        }
      },
      x: {
        ticks: { color: '#333' }
      }
    }
  }
});


    chartsRendered = true;
  }
};
