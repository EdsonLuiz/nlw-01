import React, {useState, useEffect, ChangeEvent, FormEvent} from 'react'
import axios from 'axios'
import {Map, TileLayer, Marker} from 'react-leaflet'
import {Link, useHistory} from 'react-router-dom'
import {FiArrowLeft} from 'react-icons/fi'
import {LeafletMouseEvent} from 'leaflet'
import './styles.css'
import api from '../../services/api'

import logo from '../../assets/logo.svg'
import Dropzone from '../../components/Dropzone';


interface Item {
  id: number,
  title: string,
  image_url: string
}

interface IBGEUFResponse {
  sigla: string
}

interface IBGECityResponse {
  nome: string
}


export const CreatePoint = () => {

  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])

  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  })

  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedUf, setSelectedUf] = useState('0')
  const [selectedCity, setSelectedCity] = useState('0')
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0])

  const [selectedFile, setSelectedFile] = useState<File>();

  const history = useHistory()

  useEffect(() => {
    api.get('items')
      .then(response => {
        setItems(response.data)
      })
  }, [])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const {latitude, longitude} = position.coords
      setInitialPosition([
        latitude, longitude
      ])
    })
  }, [])

  useEffect(() => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then(response => {
        const ufInitials = response.data.map(uf => uf.sigla)
        setUfs(ufInitials)
      })
  }, [])

  useEffect(() => {
    if(selectedUf === '0')
      return

    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then(response => {
        const cityNames = response.data.map(city => city.nome)
        setCities(cityNames)
      })
  }, [selectedUf])


  function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value
    setSelectedUf(uf)
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value
    setSelectedCity(city)
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng
    ])
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const {name, value} = event.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  function handleSelectedItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id)

    if(alreadySelected >=0) {
      const filteredItems = selectedItems.filter(item => item !== id)
       setSelectedItems(filteredItems)
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  async function handleSubmit(event: FormEvent ) {
    event.preventDefault()

    const {name, email, whatsapp} = formData
    const uf = selectedUf
    const city = selectedCity
    const [latitude, longitude] = selectedPosition 
    const items = selectedItems

    const data = new FormData()

      data.append('name',name)
      data.append('email', email)
      data.append('whatsapp', whatsapp)
      data.append('uf', uf)
      data.append('city', city)
      data.append('latitude', String(latitude))
      data.append('longitude', String(longitude))
      data.append('items' ,String(items))
      if(selectedFile)
        data.append('image', selectedFile)

    console.log(data)
    await api.post('points', data)
    alert('ponto de coleta criado')
    history.push('/')
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta logo"/>

        <Link to="/">
          <FiArrowLeft />
          Voltar para a home
        </Link>
      </header>


      <form onSubmit={handleSubmit}>
        <h1>Cadastro do<br /> ponto de coleta</h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
           <label htmlFor="name">Nom da entidade</label>
           <input 
              id="name" 
              name="name"
              onChange={handleInputChange}
              type="text"/>
          </div>

          <div className="field-group">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email"
              onChange={handleInputChange}
              type="email"/>
          </div>
          <div className="field">
            <label htmlFor="whatsapp">Whatsapp</label>
            <input 
              id="whatsapp" 
              name="whatsapp"
              onChange={handleInputChange}
              type="text"/>
          </div>

          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
            <TileLayer 
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition}/>
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select onChange={handleSelectedUf} value={selectedUf} name="uf" id="uf">
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select onChange={handleSelectCity} value={selectedCity} name="city" id="city">
                <option value="0">Selecione uma cidade</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítems de coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map(item => (
              <li
                className={selectedItems.includes(item.id) ? 'selected' : '' } 
                onClick={() => handleSelectedItem(item.id)} 
                key={item.id}>
                <img src={item.image_url} alt="teste"/>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div>
  )
}
