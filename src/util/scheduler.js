const { where } = require("sequelize");
const HorarioConfig = require("../models/horario.config.model");
const Horario = require("../models/horario.model");
const { Op } = require('sequelize');

const generarTodosHorarios = async () => {
    const horarioConfigs = await HorarioConfig.findAll({
        where: { estado: true }
    });
    if (!horarioConfigs) {
        return; //Vacio
    }
    horarioConfigs.forEach(e => {
        generarHorarios(e);
    });
}

const generarHorarios = async (horarioConfig, dias = 30) => {
    const { domingo, lunes, martes, miercoles, jueves, viernes, sabado,
        horaIni, minIni, horaFin, minFin, intervalo, idDistrib, idLocal, id } = horarioConfig.dataValues;
    const diasSemana = [domingo, lunes, martes, miercoles, jueves, viernes, sabado];
    const minutosIni = horaIni * 60 + minIni;
    const minutosFin = horaFin * 60 + minFin;
    let nuevosHorarios = [];
    let fecha = new Date();
    let date = new Date();
    const ultimaFecha = date.setDate(date.getDate() + dias);
    while (fecha <= ultimaFecha) {
        if (diasSemana[fecha.getDay()]) {
            //procede a generar horarios para ese dia
            let minutoHorarioInicio = minutosIni;
            let minutoHorarioFin = minutoHorarioInicio + intervalo;
            while (minutoHorarioFin <= minutosFin) {
                nuevosHorarios.push({
                    fecha: fecha.toISOString().slice(0, 10),
                    horaIni: minToTime(minutoHorarioInicio),
                    horaFin: minToTime(minutoHorarioFin),
                    estado: true,
                    idDistrib: idDistrib,
                    idLocal: idLocal,
                    idHorarioConfig: id,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                minutoHorarioInicio = minutoHorarioFin;
                minutoHorarioFin = minutoHorarioFin + intervalo;
            }
        }
        fecha.setDate(fecha.getDate() + 1);
    }
    //Insertando
    Horario.bulkCreate(nuevosHorarios, {
        updateOnDuplicate: ['estado', 'idLocal', 'updatedAt']
    });
}

const eliminarHorarios = async (idHorarioConfig) => {
    await Horario.update({ estado: false }, {
        where: {
            idHorarioConfig: idHorarioConfig,
            fecha: { [Op.gte]: (new Date()).toISOString().slice(0, 10) }
        }
    });
}

const modificarHorarios = async (idHorarioConfig) => {
    try {
        await eliminarHorarios(idHorarioConfig);
    } catch (e) { }
    const horarioConfig = await HorarioConfig.findByPk(idHorarioConfig);
    generarHorarios(horarioConfig);
}

const minToTime = (minutos) => {
    let hora = (~~(minutos / 60)).toString();
    let min = (minutos % 60).toString();
    if (hora.length < 2) hora = `0${hora}`;
    if (min.length < 2) min = `0${min}`;
    return `${hora}:${min}:00`;
}

module.exports = {
    generarTodosHorarios,
    generarHorarios,
    eliminarHorarios,
    modificarHorarios,
}