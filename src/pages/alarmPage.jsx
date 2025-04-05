export default function AlarmPage() {
  const [alarmName, setAlarmName] = useState(null);
  const [alarmTime, setAlarmTime] = useState(null);

  useEffect(() => {
    // Get query parameters from the URL
    const params = new URLSearchParams(window.location.search);
    const name = params.get('alarmName');
    const time = params.get('alarmTime');
    
    setAlarmName(name);
    setAlarmTime(time);
  }, []);

  return (
    <div>
      <h1>Alarm page</h1>
    </div>
  );
}
