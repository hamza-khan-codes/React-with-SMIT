import { useEffect, useState } from "react"


export default function App() {
  const [formData, setFormData] = useState({
    email: "hamzakhan@gmail.com",
    password: "12345",
    userName: "hamza",
    msg: null,
    count: 0,
  })




  
  

  useEffect(() => {
    setFormData((state) => ({
      ...state,
      msg: "first Mount",
      count:state.count + 1
    }))
  }, [])
  useEffect(() => {
    
    setFormData((state) => ({
      ...state,
      msg: "name is changed",
      count: state.count + 1
    }))

  }, [formData.userName])
  const obj = {
    name: "halj"
  }
  
  

  return (
    <div>
      Name 
      <br />
      <input type="text" value={formData.userName} onChange={(e) => setFormData((state) => ({
        ...state,
        userName :e.target.value }))}  />
      <br />
      Email
      <br />
      <input type="email" value={formData.email} />
      <br />
      Password
      <br />
      <input type="password" value={formData.password} />
      <br />

    </div>
  )
}
