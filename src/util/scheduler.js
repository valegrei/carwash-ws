const { where } = require("sequelize");
const HorarioConfig = require("../models/horario.config.model");
const Horario = require("../models/horario.model");
const { Op } = require('sequelize');
const logger = require('./logger');
const cron = require('node-cron');

const generarHorariosTask = cron.schedule('0 1 25 * *', () => {
    logger.info('Ejecutando el 25 a las 01:00 at America/Lima timezone');
    generarTodosHorariosSiguienteMes();
}, {
    scheduled: true,
    timezone: "America/Lima"
});

const generarTodosHorariosSiguienteMes = async () => {
    const horarioConfigs = await HorarioConfig.findAll({
        where: { estado: true }
    });
    if (!horarioConfigs) {
        return; //Vacio
    }
    horarioConfigs.forEach(async (e) => {
        try {
            await generarParaSiguienteMes(e);
        } catch (error) { logger.error(error) }
    });
}

const generarParaEsteMesOSiguiente = async (horarioConfig) => {
    const fechaHoy = new Date();
    if (fechaHoy.getDate() < 25) {
        //Se crea solo para ese mes
        const ultimoDiaEsteMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + 1, 0)
        await generarHorariosPorFecha(horarioConfig, fechaHoy, ultimoDiaEsteMes);
    } else {
        //Tambien se crea para el siguiente mes 
        const ultimoDiaSiguienteMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + 2, 0)
        await generarHorariosPorFecha(horarioConfig, fechaHoy, ultimoDiaSiguienteMes);
    }
};

const generarParaSiguienteMes = async (horarioConfig) => {
    const fechaHoy = new Date();
    const primerDiaSiguienteMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + 2, 1)
    const ultimoDiaSiguienteMes = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + 2, 0)
    await generarHorariosPorFecha(horarioConfig, primerDiaSiguienteMes, ultimoDiaSiguienteMes);
};

const generarHorariosPorFecha = async (horarioConfig, fechaInicio, fechaFin) => {
    const { domingo, lunes, martes, miercoles, jueves, viernes, sabado,
        horaIni, minIni, horaFin, minFin, intervalo, idDistrib, idLocal, id } = horarioConfig.dataValues;
    const diasSemana = [domingo, lunes, martes, miercoles, jueves, viernes, sabado];
    const minutosIni = horaIni * 60 + minIni;
    const minutosFin = horaFin * 60 + minFin;
    let nuevosHorarios = [];
    let fechaIter = new Date(fechaInicio.getTime());
    const createdAt = Date.now();
    while (fecha <= fechaFin) {
        if (diasSemana[fechaIter.getDay()]) {
            //procede a generar horarios para ese dia
            let minutoHorarioInicio = minutosIni;
            let minutoHorarioFin = minutoHorarioInicio + intervalo;
            while (minutoHorarioFin <= minutosFin) {
                let fecha = fechaIter.toLocaleDateString("fr-CA");//yyyy-MM-dd
                let horaIni = minToTime(minutoHorarioInicio);
                let horaFin = minToTime(minutoHorarioFin);
                let fechaHora = `${fecha} ${horaIni}`;
                nuevosHorarios.push({
                    fechaHora: fechaHora,
                    fecha: fecha,
                    horaIni: horaIni,
                    horaFin: horaFin,
                    estado: true,
                    idDistrib: idDistrib,
                    idLocal: idLocal,
                    idHorarioConfig: id,
                    createdAt: createdAt,
                    updatedAt: createdAt,
                });
                minutoHorarioInicio = minutoHorarioFin;
                minutoHorarioFin = minutoHorarioFin + intervalo;
            }
        }
        fechaIter.setDate(fechaIter.getDate() + 1);
    }
    //Insertando
    await Horario.bulkCreate(nuevosHorarios, {
        updateOnDuplicate: ['estado', 'idLocal', 'updatedAt']
    });
}

const eliminarHorarios = async (idHorarioConfig) => {
    await Horario.update({ estado: false }, {
        where: {
            idHorarioConfig: idHorarioConfig,
            fecha: { [Op.gte]: (new Date()).toLocaleDateString("fr-CA") }
        }
    });
}

const modificarHorarios = async (idHorarioConfig) => {
    await eliminarHorarios(idHorarioConfig);
    const horarioConfig = await HorarioConfig.findByPk(idHorarioConfig);
    generarParaEsteMesOSiguiente(horarioConfig);
}

const minToTime = (minutos) => {
    let hora = (~~(minutos / 60)).toString();
    let min = (minutos % 60).toString();
    if (hora.length < 2) hora = `0${hora}`;
    if (min.length < 2) min = `0${min}`;
    return `${hora}:${min}:00`;
}

module.exports = {
    generarTodosHorariosSiguienteMes,
    generarParaEsteMesOSiguiente,
    eliminarHorarios,
    modificarHorarios,
    generarHorariosTask,
}